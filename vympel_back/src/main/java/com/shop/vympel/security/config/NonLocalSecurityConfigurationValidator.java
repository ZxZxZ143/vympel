package com.shop.vympel.security.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class NonLocalSecurityConfigurationValidator
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    private static final Set<String> SAFE_PROFILES = Set.of("local", "test");
    private static final Set<String> PLACEHOLDERS = Set.of(
            "password", "admin", "minioadmin", "minioadmin123", "change-me", "changeme",
            "secret", "default", "test", "123", "postgres", "dev", "development"
    );

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        validate(applicationContext.getEnvironment());
    }

    public static void validate(Environment environment) {
        Set<String> activeProfiles = new HashSet<>(Arrays.asList(environment.getActiveProfiles()));
        if (!activeProfiles.isEmpty() && activeProfiles.stream().allMatch(SAFE_PROFILES::contains)) {
            return;
        }

        List<String> errors = new ArrayList<>();
        if (activeProfiles.stream().anyMatch(SAFE_PROFILES::contains)) {
            errors.add("local/test profiles must not be combined with non-local profiles");
        }
        String jwtSecret = required(environment, "security.jwt.secret", "JWT secret", errors);
        validateStrongSecret(jwtSecret, "JWT secret", errors);

        String hmacSecret = required(environment, "security.rate-limit.hmac-secret", "rate-limit HMAC secret", errors);
        validateStrongSecret(hmacSecret, "rate-limit HMAC secret", errors);
        if (jwtSecret != null && jwtSecret.equals(hmacSecret)) {
            errors.add("JWT and rate-limit HMAC secrets must be different");
        }

        String dbUrl = required(environment, "spring.datasource.url", "database URL", errors);
        required(environment, "spring.datasource.username", "database username", errors);
        rejectPlaceholder(environment.getProperty("spring.datasource.password"), "database password", errors);

        String storageEndpoint = required(environment, "storage.s3.endpoint", "object-storage endpoint", errors);
        String storagePublicEndpoint = required(
                environment,
                "storage.s3.public-endpoint",
                "object-storage public endpoint",
                errors
        );
        required(environment, "storage.s3.bucket", "object-storage bucket", errors);
        rejectPlaceholder(environment.getProperty("storage.s3.access-key"), "object-storage access key", errors);
        rejectPlaceholder(environment.getProperty("storage.s3.secret-key"), "object-storage secret key", errors);

        String origins = required(environment, "app.cors.allowed-origins", "CORS origins", errors);
        validateCors(origins, errors);

        if (!environment.getProperty("security.crm-session.secure", Boolean.class, true)) {
            errors.add("CRM refresh cookie must be Secure outside local/test profiles");
        }

        boolean allowLocalhost = environment.getProperty(
                "app.security.allow-localhost-services", Boolean.class, false
        );
        boolean allowInsecureTransport = environment.getProperty(
                "app.security.allow-insecure-service-transport", Boolean.class, false
        );
        if (!allowLocalhost) {
            rejectLocalhost(dbUrl, "database URL", errors);
            rejectLocalhost(storageEndpoint, "object-storage endpoint", errors);
            rejectLocalhost(storagePublicEndpoint, "object-storage public endpoint", errors);
            if (origins != null && origins.toLowerCase(Locale.ROOT).contains("localhost")) {
                errors.add("CORS origins must not include localhost outside local/test profiles");
            }
        }
        if (!allowInsecureTransport) {
            requireScheme(storageEndpoint, Set.of("https"), "object-storage endpoint", errors);
            requireScheme(storagePublicEndpoint, Set.of("https"), "object-storage public endpoint", errors);
        }

        if (!environment.getProperty("security.rate-limit.enabled", Boolean.class, true)) {
            errors.add("rate limiting must be enabled outside local/test profiles");
        }
        String storage = environment.getProperty("security.rate-limit.storage", "redis");
        if (!"redis".equalsIgnoreCase(storage)) {
            errors.add("distributed Redis rate-limit storage is required outside local/test profiles");
        } else {
            String redisUrl = required(environment, "spring.data.redis.url", "Redis rate-limit URL", errors);
            if (!allowLocalhost) {
                rejectLocalhost(redisUrl, "Redis rate-limit URL", errors);
            }
            requireScheme(redisUrl, allowInsecureTransport ? Set.of("redis", "rediss") : Set.of("rediss"),
                    "Redis rate-limit URL", errors);
        }

        boolean cmsEnabled = environment.getProperty(
                "app.cms.public-revalidate.enabled", Boolean.class, true
        );
        boolean cmsRequired = environment.getProperty(
                "app.cms.public-revalidate.required", Boolean.class, true
        );
        if (!cmsEnabled) {
            errors.add("CMS public revalidation must be enabled outside local/test profiles");
        }
        if (cmsRequired || cmsEnabled) {
            String url = required(environment, "app.cms.public-revalidate.url", "CMS revalidation URL", errors);
            String secret = required(environment, "app.cms.public-revalidate.secret", "CMS revalidation secret", errors);
            validateStrongSecret(secret, "CMS revalidation secret", errors);
            if (!allowLocalhost) {
                rejectLocalhost(url, "CMS revalidation URL", errors);
            }
            if (!allowInsecureTransport) {
                requireScheme(url, Set.of("https"), "CMS revalidation URL", errors);
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Insecure non-local configuration: " + String.join("; ", errors));
        }
    }

    private static String required(Environment environment, String property, String label, List<String> errors) {
        String value = environment.getProperty(property);
        if (value == null || value.isBlank()) {
            errors.add(label + " is required");
            return null;
        }
        return value.trim();
    }

    private static void validateStrongSecret(String value, String label, List<String> errors) {
        if (value == null) {
            return;
        }
        rejectPlaceholder(value, label, errors);
        long distinct = value.chars().distinct().count();
        if (value.length() < 48 || distinct < 12) {
            errors.add(label + " must contain at least 48 high-entropy characters");
        }
    }

    private static void rejectPlaceholder(String value, String label, List<String> errors) {
        if (value == null || value.isBlank()) {
            errors.add(label + " is required");
            return;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (PLACEHOLDERS.contains(normalized)
                || normalized.contains("change-me")
                || normalized.contains("placeholder")
                || normalized.contains("local-only")
                || normalized.contains("test-only")) {
            errors.add(label + " must not use a known placeholder/default value");
        }
    }

    private static void validateCors(String origins, List<String> errors) {
        if (origins == null) {
            return;
        }
        List<String> values = Arrays.stream(origins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
        if (values.isEmpty() || values.contains("*")) {
            errors.add("credentialed CORS requires explicit non-wildcard origins");
        }
        values.forEach(value -> validateCorsOrigin(value, errors));
    }

    private static void validateCorsOrigin(String value, List<String> errors) {
        if (value.contains("*")) {
            errors.add("credentialed CORS requires explicit non-wildcard origins");
            return;
        }
        try {
            URI uri = URI.create(value);
            boolean exactOrigin = "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && uri.getUserInfo() == null
                    && (uri.getPath() == null || uri.getPath().isEmpty())
                    && uri.getQuery() == null
                    && uri.getFragment() == null;
            if (!exactOrigin) {
                errors.add("CORS origin must be an exact HTTPS origin without path, query, fragment, wildcard, or user-info");
            }
        } catch (IllegalArgumentException ex) {
            errors.add("CORS origin is invalid");
        }
    }

    private static void rejectLocalhost(String value, String label, List<String> errors) {
        if (value == null) {
            return;
        }
        String normalized = value.toLowerCase(Locale.ROOT);
        if (normalized.contains("localhost") || normalized.contains("127.0.0.1") || normalized.contains("[::1]")) {
            errors.add(label + " must not point to localhost outside local/test profiles");
        }
    }

    private static void requireScheme(String value, Set<String> allowed, String label, List<String> errors) {
        if (value == null) {
            return;
        }
        try {
            String scheme = URI.create(value).getScheme();
            if (scheme == null || !allowed.contains(scheme.toLowerCase(Locale.ROOT))) {
                errors.add(label + " must use " + String.join("/", allowed));
            }
        } catch (IllegalArgumentException ex) {
            errors.add(label + " is invalid");
        }
    }
}
