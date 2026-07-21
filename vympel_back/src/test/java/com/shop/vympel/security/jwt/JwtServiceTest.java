package com.shop.vympel.security.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class JwtServiceTest {
    private static final String SECRET = "test-secret-that-is-at-least-thirty-two-bytes-long";
    private static final Instant NOW = Instant.parse("2026-07-16T12:00:00Z");

    @Test
    void issuesTypedAccessAndRefreshTokensWithRequiredClaims() {
        JwtService service = serviceAt(NOW, 0);

        String accessToken = service.generateAccessToken("42", List.of("ADMIN", "MANAGER"));
        JwtService.IssuedRefreshToken refreshToken = service.generateRefreshToken("42");

        JwtService.JwtClaims accessClaims = service.parseAccessToken(accessToken);
        JwtService.JwtClaims refreshClaims = service.parseRefreshToken(refreshToken.token());

        assertThat(accessClaims.subject()).isEqualTo("42");
        assertThat(accessClaims.type()).isEqualTo("access");
        assertThat(accessClaims.roles()).containsExactly("ADMIN", "MANAGER");
        assertThat(accessClaims.jwtId()).isNotBlank();
        assertThat(accessClaims.issuedAt()).isEqualTo(NOW);
        assertThat(accessClaims.expiresAt()).isEqualTo(NOW.plusSeconds(15 * 60));

        assertThat(refreshClaims.subject()).isEqualTo("42");
        assertThat(refreshClaims.type()).isEqualTo("refresh");
        assertThat(refreshClaims.roles()).isEmpty();
        assertThat(refreshClaims.jwtId()).isEqualTo(refreshToken.jwtId());
        assertThat(refreshClaims.expiresAt()).isEqualTo(NOW.plusSeconds(14L * 24 * 60 * 60));
    }

    @Test
    void rejectsUsingRefreshTokensAsAccessTokensAndViceVersa() {
        JwtService service = serviceAt(NOW, 0);
        String accessToken = service.generateAccessToken("42", List.of("ADMIN"));
        String refreshToken = service.generateRefreshToken("42").token();

        assertThatExceptionOfType(MalformedJwtException.class)
                .isThrownBy(() -> service.parseAccessToken(refreshToken));
        assertThatExceptionOfType(MalformedJwtException.class)
                .isThrownBy(() -> service.parseRefreshToken(accessToken));
    }

    @Test
    void enforcesExpirationAndAllowsOnlyConfiguredClockSkew() {
        String accessToken = serviceAt(NOW, 0).generateAccessToken("42", List.of("ADMIN"));

        assertThatExceptionOfType(ExpiredJwtException.class)
                .isThrownBy(() -> serviceAt(NOW.plusSeconds(15 * 60 + 1), 0).parseAccessToken(accessToken));

        assertThat(serviceAt(NOW.plusSeconds(15 * 60 + 20), 30).parseAccessToken(accessToken).subject())
                .isEqualTo("42");
    }

    @Test
    void rejectsTokensFromAnotherIssuerOrAudience() {
        String token = serviceAt(NOW, 0).generateAccessToken("42", List.of("ADMIN"));
        JwtService wrongContract = new JwtService(
                SECRET,
                15,
                14,
                "another-issuer",
                "another-audience",
                0,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );

        assertThatThrownByJwtValidation(() -> wrongContract.parseAccessToken(token));
    }

    @Test
    void rejectsExpiredRefreshTokens() {
        String refreshToken = serviceAt(NOW, 0).generateRefreshToken("42").token();

        assertThatExceptionOfType(ExpiredJwtException.class)
                .isThrownBy(() -> serviceAt(NOW.plusSeconds(14L * 24 * 60 * 60 + 1), 0)
                        .parseRefreshToken(refreshToken));
    }

    @Test
    void rejectsTokensWithAnotherSignature() {
        String token = serviceAt(NOW, 0).generateAccessToken("42", List.of("ADMIN"));
        JwtService otherSigner = new JwtService(
                "another-test-secret-that-is-at-least-thirty-two-bytes",
                15,
                14,
                "vympel-api",
                "vympel-crm",
                0,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );

        assertThatThrownByJwtValidation(() -> otherSigner.parseAccessToken(token));
    }

    private JwtService serviceAt(Instant instant, long clockSkewSeconds) {
        return new JwtService(
                SECRET,
                15,
                14,
                "vympel-api",
                "vympel-crm",
                clockSkewSeconds,
                Clock.fixed(instant, ZoneOffset.UTC)
        );
    }

    private void assertThatThrownByJwtValidation(Runnable validation) {
        org.assertj.core.api.Assertions.assertThatThrownBy(validation::run)
                .isInstanceOf(io.jsonwebtoken.JwtException.class);
    }
}
