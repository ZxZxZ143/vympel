package com.shop.vympel.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

public class JwtService {

    private final SecretKey key;
    private final long accessTtlMin;
    private final long refreshTtlDays;
    private final String issuer;
    private final String audience;
    private final long clockSkewSeconds;
    private final Clock clock;

    public JwtService(
            String secret,
            long accessTtlMin,
            long refreshTtlDays,
            String issuer,
            String audience,
            long clockSkewSeconds
    ) {
        this(secret, accessTtlMin, refreshTtlDays, issuer, audience, clockSkewSeconds, Clock.systemUTC());
    }

    public JwtService(
            String secret,
            long accessTtlMin,
            long refreshTtlDays,
            String issuer,
            String audience,
            long clockSkewSeconds,
            Clock clock
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlMin = accessTtlMin;
        this.refreshTtlDays = refreshTtlDays;
        this.issuer = Objects.requireNonNull(issuer);
        this.audience = Objects.requireNonNull(audience);
        this.clockSkewSeconds = clockSkewSeconds;
        this.clock = Objects.requireNonNull(clock);
    }

    public String generateAccessToken(String subject, List<String> roles) {
        Instant now = clock.instant();
        Instant exp = now.plusSeconds(accessTtlMin * 60);
        return Jwts.builder()
                .issuer(issuer)
                .audience().add(audience).and()
                .subject(subject)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("roles", roles == null ? List.of() : List.copyOf(roles))
                .claim("type", "access")
                .signWith(key)
                .compact();
    }

    public IssuedRefreshToken generateRefreshToken(String subject) {
        Instant now = clock.instant();
        Instant exp = now.plusSeconds(refreshTtlDays * 24 * 60 * 60);
        String jwtId = UUID.randomUUID().toString();
        String token = Jwts.builder()
                .issuer(issuer)
                .audience().add(audience).and()
                .subject(subject)
                .id(jwtId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claims(Map.of("type", "refresh"))
                .signWith(key)
                .compact();

        return new IssuedRefreshToken(token, jwtId, now, exp);
    }

    public JwtClaims parseAccessToken(String token) {
        return parseAndValidate(token, "access");
    }

    public JwtClaims parseRefreshToken(String token) {
        return parseAndValidate(token, "refresh");
    }

    private JwtClaims parseAndValidate(String token, String expectedType) {
        var claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .clockSkewSeconds(clockSkewSeconds)
                .clock(() -> Date.from(clock.instant()))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String subject = claims.getSubject();
        String type = claims.get("type", String.class);
        String jwtId = claims.getId();
        if (subject == null || subject.isBlank() || jwtId == null || jwtId.isBlank()) {
            throw new MalformedJwtException("JWT subject and ID are required");
        }
        if (!expectedType.equals(type)) {
            throw new MalformedJwtException("Unexpected JWT type");
        }

        return new JwtClaims(
                subject,
                roles(claims.get("roles")),
                type,
                jwtId,
                claims.getIssuedAt().toInstant(),
                claims.getExpiration().toInstant()
        );
    }

    private List<String> roles(Object value) {
        if (!(value instanceof Collection<?> collection)) {
            return List.of();
        }

        return collection.stream()
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .distinct()
                .toList();
    }

    public record IssuedRefreshToken(String token, String jwtId, Instant issuedAt, Instant expiresAt) {}

    public record JwtClaims(
            String subject,
            List<String> roles,
            String type,
            String jwtId,
            Instant issuedAt,
            Instant expiresAt
    ) {}
}
