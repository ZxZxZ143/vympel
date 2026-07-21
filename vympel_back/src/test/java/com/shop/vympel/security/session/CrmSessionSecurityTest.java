package com.shop.vympel.security.session;

import com.shop.vympel.security.jwt.JwtProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class CrmSessionSecurityTest {
    @Test
    void refreshCookieIsHostOnlyHttpOnlyScopedAndSecureWhenConfigured() {
        CrmSessionProperties sessionProperties = sessionProperties(true);
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshTtlDays(14);
        CrmRefreshCookieService cookieService = new CrmRefreshCookieService(sessionProperties, jwtProperties);
        MockHttpServletResponse response = new MockHttpServletResponse();

        cookieService.set(response, "opaque-refresh-token");

        String cookie = response.getHeader("Set-Cookie");
        assertThat(cookie)
                .contains("vympel_crm_refresh=opaque-refresh-token")
                .contains("Path=/api/crm/auth")
                .contains("Max-Age=1209600")
                .contains("Secure")
                .contains("HttpOnly")
                .contains("SameSite=Lax")
                .doesNotContain("Domain=");
    }

    @Test
    void clearingCookieUsesTheSameScopeAndImmediateExpiration() {
        CrmRefreshCookieService cookieService = new CrmRefreshCookieService(
                sessionProperties(false),
                jwtProperties()
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        cookieService.clear(response);

        assertThat(response.getHeader("Set-Cookie"))
                .contains("vympel_crm_refresh=")
                .contains("Path=/api/crm/auth")
                .contains("Max-Age=0")
                .contains("HttpOnly")
                .contains("SameSite=Lax")
                .doesNotContain("Secure");
    }

    @Test
    void originValidationUsesAnExactAllowListWithRefererFallback() {
        TrustedOriginValidator validator = new TrustedOriginValidator(
                "http://localhost:3001,https://crm.vympel.example"
        );
        MockHttpServletRequest originRequest = new MockHttpServletRequest();
        originRequest.addHeader("Origin", "http://localhost:3001");
        MockHttpServletRequest refererRequest = new MockHttpServletRequest();
        refererRequest.addHeader("Referer", "https://crm.vympel.example/settings?tab=auth");

        validator.validate(originRequest);
        validator.validate(refererRequest);

        MockHttpServletRequest untrusted = new MockHttpServletRequest();
        untrusted.addHeader("Origin", "https://crm.vympel.example.evil.test");
        assertThatExceptionOfType(AccessDeniedException.class)
                .isThrownBy(() -> validator.validate(untrusted));
        assertThatExceptionOfType(AccessDeniedException.class)
                .isThrownBy(() -> validator.validate(new MockHttpServletRequest()));
    }

    @Test
    void wildcardCredentialedOriginConfigurationFailsClosed() {
        assertThatExceptionOfType(IllegalStateException.class)
                .isThrownBy(() -> new TrustedOriginValidator("*"));
    }

    private CrmSessionProperties sessionProperties(boolean secure) {
        CrmSessionProperties properties = new CrmSessionProperties();
        properties.setCookieName("vympel_crm_refresh");
        properties.setCookiePath("/api/crm/auth");
        properties.setSecure(secure);
        properties.setSameSite("Lax");
        properties.setCleanupRetentionDays(30);
        return properties;
    }

    private JwtProperties jwtProperties() {
        JwtProperties properties = new JwtProperties();
        properties.setRefreshTtlDays(14);
        return properties;
    }
}
