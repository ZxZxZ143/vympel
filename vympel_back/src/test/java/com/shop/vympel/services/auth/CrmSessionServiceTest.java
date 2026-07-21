package com.shop.vympel.services.auth;

import com.shop.vympel.db.entity.auth.RefreshTokenSession;
import com.shop.vympel.db.entity.auth.Role;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.entity.auth.UserRole;
import com.shop.vympel.db.repositories.user.RefreshTokenSessionRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.exceptions.InvalidRefreshTokenException;
import com.shop.vympel.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class CrmSessionServiceTest {
    private static final Instant NOW = Instant.parse("2026-07-16T12:00:00Z");
    private static final String SECRET = "test-secret-that-is-at-least-thirty-two-bytes-long";

    @Mock
    private RefreshTokenSessionRepository sessionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserRoleRepository userRoleRepository;

    private final List<RefreshTokenSession> sessions = new ArrayList<>();
    private User user;
    private JwtService jwtService;
    private CrmSessionService service;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(42L);
        user.setEmail("admin@vympel.test");
        user.setEnabled(true);
        jwtService = new JwtService(
                SECRET,
                15,
                14,
                "vympel-api",
                "vympel-crm",
                0,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
        service = new CrmSessionService(
                sessionRepository,
                userRepository,
                userRoleRepository,
                jwtService,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );

        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(sessionRepository.save(any(RefreshTokenSession.class))).thenAnswer(invocation -> {
            RefreshTokenSession session = invocation.getArgument(0);
            if (sessions.stream().noneMatch(existing -> existing == session)) {
                sessions.add(session);
            }
            return session;
        });
        when(sessionRepository.findByTokenHashForUpdate(any())).thenAnswer(invocation -> {
            String hash = invocation.getArgument(0);
            return sessions.stream().filter(session -> session.getTokenHash().equals(hash)).findFirst();
        });
        lenient().when(userRoleRepository.findByUserId(42L)).thenReturn(List.of(userRole("ADMIN")));
    }

    @Test
    void storesOnlyHashedRefreshIdentityAndRotatesWithinOneFamily() {
        CrmSessionService.SessionTokens original = startSession();

        CrmSessionService.SessionTokens replacement = service.rotate(original.refreshToken());

        assertThat(sessions).hasSize(2);
        assertThat(original.session().getTokenHash()).hasSize(64).doesNotContain(original.refreshToken());
        assertThat(original.session().getRevocationReason()).isEqualTo(CrmSessionService.REASON_ROTATED);
        assertThat(original.session().getRevokedAt()).isEqualTo(NOW);
        assertThat(original.session().getReplacedBySession()).isSameAs(replacement.session());
        assertThat(replacement.session().getFamilyId()).isEqualTo(original.session().getFamilyId());
        assertThat(replacement.session().getRevokedAt()).isNull();
        assertThat(jwtService.parseAccessToken(replacement.accessToken()).roles()).containsExactly("ADMIN");
    }

    @Test
    void detectsRotatedTokenReuseAndRevokesTheActiveFamily() {
        CrmSessionService.SessionTokens original = startSession();
        service.rotate(original.refreshToken());

        assertThatExceptionOfType(InvalidRefreshTokenException.class)
                .isThrownBy(() -> service.rotate(original.refreshToken()));

        assertThat(original.session().getRevocationReason()).isEqualTo(CrmSessionService.REASON_REUSE);
        verify(sessionRepository).revokeActiveByFamilyId(
                eq(original.session().getFamilyId()),
                eq(NOW),
                eq(CrmSessionService.REASON_REUSE)
        );
    }

    @Test
    void logoutIsIdempotentAndRevokesTheCurrentRefreshSession() {
        CrmSessionService.SessionTokens session = startSession();

        service.logout(session.refreshToken());
        service.logout(session.refreshToken());
        service.logout(null);

        assertThat(session.session().getRevocationReason()).isEqualTo(CrmSessionService.REASON_LOGOUT);
        assertThat(session.session().getRevokedAt()).isEqualTo(NOW);
    }

    @Test
    void rejectsRefreshForDisabledUsersAndRevokesAllTheirSessions() {
        CrmSessionService.SessionTokens session = startSession();
        user.setEnabled(false);

        assertThatExceptionOfType(InvalidRefreshTokenException.class)
                .isThrownBy(() -> service.rotate(session.refreshToken()));

        verify(sessionRepository).revokeActiveByUserId(
                42L,
                NOW,
                CrmSessionService.REASON_USER_DISABLED
        );
    }

    @Test
    void rejectsRefreshAfterCrmRolesAreRemoved() {
        CrmSessionService.SessionTokens session = startSession();
        when(userRoleRepository.findByUserId(42L)).thenReturn(List.of(userRole("USER")));

        assertThatExceptionOfType(InvalidRefreshTokenException.class)
                .isThrownBy(() -> service.rotate(session.refreshToken()));

        verify(sessionRepository).revokeActiveByUserId(
                42L,
                NOW,
                CrmSessionService.REASON_CRM_ACCESS_REVOKED
        );
    }

    @Test
    void rotatedAccessTokenUsesCurrentDatabaseRoles() {
        CrmSessionService.SessionTokens session = startSession();
        when(userRoleRepository.findByUserId(42L)).thenReturn(List.of(userRole("MANAGER")));

        CrmSessionService.SessionTokens replacement = service.rotate(session.refreshToken());

        assertThat(jwtService.parseAccessToken(replacement.accessToken()).roles()).containsExactly("MANAGER");
    }

    private CrmSessionService.SessionTokens startSession() {
        return service.startSession(new AuthenticatedUser(42L, List.of("ADMIN")));
    }

    private UserRole userRole(String code) {
        Role role = new Role();
        role.setCode(code);
        role.setActive(true);
        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        return userRole;
    }
}
