package com.shop.vympel.security.session;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class TrustedOriginValidator {
    private final Set<String> allowedOrigins;

    public TrustedOriginValidator(
            @Value("${app.cors.allowed-origins}") String allowedOrigins
    ) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .map(this::normalizeOrigin)
                .collect(Collectors.toUnmodifiableSet());

        if (this.allowedOrigins.isEmpty() || this.allowedOrigins.contains("*")) {
            throw new IllegalStateException("Credentialed CRM origins must be an explicit non-empty allow-list");
        }
    }

    public void validate(HttpServletRequest request) {
        String requestOrigin = request.getHeader("Origin");
        if (requestOrigin == null || requestOrigin.isBlank()) {
            requestOrigin = originFromReferer(request.getHeader("Referer"));
        }

        if (requestOrigin == null || !allowedOrigins.contains(normalizeOrigin(requestOrigin))) {
            throw new AccessDeniedException("Untrusted request origin");
        }
    }

    private String originFromReferer(String referer) {
        if (referer == null || referer.isBlank()) {
            return null;
        }

        try {
            URI uri = URI.create(referer);
            if (uri.getScheme() == null || uri.getRawAuthority() == null) {
                return null;
            }
            return uri.getScheme() + "://" + uri.getRawAuthority();
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String normalizeOrigin(String origin) {
        String normalized = origin == null ? "" : origin.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
