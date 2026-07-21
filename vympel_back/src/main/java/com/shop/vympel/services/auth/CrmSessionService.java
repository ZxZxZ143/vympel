package com.shop.vympel.services.auth;

import com.shop.vympel.db.entity.auth.RefreshTokenSession;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.repositories.user.RefreshTokenSessionRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.exceptions.InvalidRefreshTokenException;
import com.shop.vympel.logging.SecurityAuditLogger;
import com.shop.vympel.security.jwt.JwtService;
import io.jsonwebtoken.JwtException;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class CrmSessionService {
    public static final String REASON_ROTATED = "ROTATED";
    public static final String REASON_LOGOUT = "LOGOUT";
    public static final String REASON_REUSE = "REUSE_DETECTED";
    public static final String REASON_USER_DISABLED = "USER_DISABLED";
    public static final String REASON_ROLE_CHANGED = "ROLE_CHANGED";
    public static final String REASON_CRM_ACCESS_REVOKED = "CRM_ACCESS_REVOKED";

    private final RefreshTokenSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtService jwtService;
    private final Clock clock;
    private final MeterRegistry meterRegistry;

    @Autowired
    public CrmSessionService(
            RefreshTokenSessionRepository sessionRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            JwtService jwtService,
            MeterRegistry meterRegistry
    ) {
        this(sessionRepository, userRepository, userRoleRepository, jwtService, Clock.systemUTC(), meterRegistry);
    }

    CrmSessionService(
            RefreshTokenSessionRepository sessionRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            JwtService jwtService,
            Clock clock
    ) {
        this(sessionRepository, userRepository, userRoleRepository, jwtService, clock, new SimpleMeterRegistry());
    }

    private CrmSessionService(
            RefreshTokenSessionRepository sessionRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            JwtService jwtService,
            Clock clock,
            MeterRegistry meterRegistry
    ) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.jwtService = jwtService;
        this.clock = clock;
        this.meterRegistry = meterRegistry;
    }

    @Transactional
    public SessionTokens startSession(AuthenticatedUser authenticatedUser) {
        if (!hasCrmRole(authenticatedUser.roles())) {
            throw new AccessDeniedException("CRM access denied");
        }

        User user = userRepository.findById(authenticatedUser.userId())
                .filter(candidate -> Boolean.TRUE.equals(candidate.getEnabled()))
                .orElseThrow(InvalidRefreshTokenException::new);

        SessionTokens session = createSession(user, authenticatedUser.roles(), UUID.randomUUID().toString());
        recordSessionEvent("start", "success");
        return session;
    }

    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public SessionTokens rotate(String refreshToken) {
        JwtService.JwtClaims claims = parseRefreshToken(refreshToken);
        Long subjectUserId = parseUserId(claims.subject());
        Instant now = clock.instant();

        RefreshTokenSession current = sessionRepository
                .findByTokenHashForUpdate(hashJwtId(claims.jwtId()))
                .orElseThrow(InvalidRefreshTokenException::new);

        if (current.getRevokedAt() != null) {
            current.setLastUsedAt(now);
            current.setRevocationReason(REASON_REUSE);
            sessionRepository.save(current);
            sessionRepository.revokeActiveByFamilyId(current.getFamilyId(), now, REASON_REUSE);
            SecurityAuditLogger.refreshTokenReuseDetected(current.getUser().getId(), current.getFamilyId());
            recordSessionEvent("refresh_replay", "rejected");
            throw new InvalidRefreshTokenException();
        }

        if (!current.getExpiresAt().isAfter(now)) {
            revoke(current, now, "EXPIRED");
            throw new InvalidRefreshTokenException();
        }

        User user = current.getUser();
        if (!Objects.equals(user.getId(), subjectUserId)) {
            revoke(current, now, REASON_REUSE);
            sessionRepository.revokeActiveByFamilyId(current.getFamilyId(), now, REASON_REUSE);
            SecurityAuditLogger.refreshTokenReuseDetected(user.getId(), current.getFamilyId());
            recordSessionEvent("refresh_replay", "rejected");
            throw new InvalidRefreshTokenException();
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            sessionRepository.revokeActiveByUserId(user.getId(), now, REASON_USER_DISABLED);
            throw new InvalidRefreshTokenException();
        }

        List<String> currentRoles = currentRoles(user.getId());
        if (!hasCrmRole(currentRoles)) {
            sessionRepository.revokeActiveByUserId(user.getId(), now, REASON_CRM_ACCESS_REVOKED);
            throw new InvalidRefreshTokenException();
        }

        revoke(current, now, REASON_ROTATED);
        SessionTokens replacement = createSession(user, currentRoles, current.getFamilyId());
        current.setReplacedBySession(replacement.session());
        sessionRepository.save(current);
        recordSessionEvent("refresh_rotate", "success");
        return replacement;
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        JwtService.JwtClaims claims;
        try {
            claims = jwtService.parseRefreshToken(refreshToken);
        } catch (JwtException | IllegalArgumentException ex) {
            return;
        }

        sessionRepository.findByTokenHashForUpdate(hashJwtId(claims.jwtId()))
                .ifPresent(session -> {
                    Long subjectUserId = parseUserIdOrNull(claims.subject());
                    if (session.getRevokedAt() == null
                            && Objects.equals(session.getUser().getId(), subjectUserId)) {
                        revoke(session, clock.instant(), REASON_LOGOUT);
                        recordSessionEvent("logout", "success");
                    }
                });
    }

    @Transactional
    public int revokeAllForUser(Long userId, String reason) {
        return sessionRepository.revokeActiveByUserId(userId, clock.instant(), reason);
    }

    @Transactional
    public int deleteRetiredBefore(Instant cutoff) {
        return sessionRepository.deleteRetiredBefore(cutoff);
    }

    private SessionTokens createSession(User user, List<String> roles, String familyId) {
        JwtService.IssuedRefreshToken refreshToken = jwtService.generateRefreshToken(String.valueOf(user.getId()));

        RefreshTokenSession session = new RefreshTokenSession();
        session.setUser(user);
        session.setTokenHash(hashJwtId(refreshToken.jwtId()));
        session.setFamilyId(familyId);
        session.setCreatedAt(refreshToken.issuedAt());
        session.setExpiresAt(refreshToken.expiresAt());
        RefreshTokenSession persisted = sessionRepository.save(session);

        String accessToken = jwtService.generateAccessToken(String.valueOf(user.getId()), roles);
        return new SessionTokens(accessToken, refreshToken.token(), persisted);
    }

    private JwtService.JwtClaims parseRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }

        try {
            return jwtService.parseRefreshToken(refreshToken);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidRefreshTokenException();
        }
    }

    private Long parseUserId(String subject) {
        Long userId = parseUserIdOrNull(subject);
        if (userId == null) {
            throw new InvalidRefreshTokenException();
        }
        return userId;
    }

    private Long parseUserIdOrNull(String subject) {
        try {
            return subject == null ? null : Long.parseLong(subject);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private List<String> currentRoles(Long userId) {
        return userRoleRepository.findByUserId(userId).stream()
                .map(userRole -> userRole.getRole().getCode())
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .distinct()
                .toList();
    }

    private boolean hasCrmRole(List<String> roles) {
        return roles != null && roles.stream()
                .anyMatch(role -> "ADMIN".equals(role) || "MANAGER".equals(role));
    }

    private void revoke(RefreshTokenSession session, Instant revokedAt, String reason) {
        session.setLastUsedAt(revokedAt);
        session.setRevokedAt(revokedAt);
        session.setRevocationReason(reason);
        sessionRepository.save(session);
    }

    static String hashJwtId(String jwtId) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(jwtId.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private void recordSessionEvent(String event, String outcome) {
        meterRegistry.counter("auth_session_events_total", "event", event, "outcome", outcome).increment();
    }

    public record SessionTokens(
            String accessToken,
            String refreshToken,
            RefreshTokenSession session
    ) {
    }
}
