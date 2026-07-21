package com.shop.vympel.security.session;

import com.shop.vympel.security.jwt.JwtProperties;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class CrmRefreshCookieService {
    private final CrmSessionProperties sessionProperties;
    private final JwtProperties jwtProperties;

    public void set(HttpServletResponse response, String refreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(refreshToken, refreshMaxAge()).toString());
    }

    public void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from(sessionProperties.getCookieName(), value)
                .httpOnly(true)
                .secure(sessionProperties.isSecure())
                .sameSite(sessionProperties.getSameSite())
                .path(sessionProperties.getCookiePath())
                .maxAge(maxAge)
                .build();
    }

    private Duration refreshMaxAge() {
        return Duration.ofDays(jwtProperties.getRefreshTtlDays());
    }
}
