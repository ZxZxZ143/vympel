package com.shop.vympel.security.ratelimit;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LoginBackoffServiceTest {
    @Test
    void repeatedFailuresCreateBoundedBackoffAndSuccessClearsState() {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setStorage("memory");
        properties.setHmacSecret("test-rate-limit-hmac-secret-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        properties.setLoginBackoffThreshold(3);
        properties.setLoginBackoffBaseSeconds(2);
        properties.setLoginBackoffMaxSeconds(30);
        RateLimitProperties.Policy failures = new RateLimitProperties.Policy();
        failures.setCapacity(10);
        failures.setWindowSeconds(900);
        failures.setFailOpen(false);
        properties.setPolicies(Map.of("login-account-failures", failures));

        RateLimitServiceTest.MutableClock clock = new RateLimitServiceTest.MutableClock(
                Instant.parse("2026-07-16T00:00:00Z")
        );
        SimpleMeterRegistry metrics = new SimpleMeterRegistry();
        RateLimitService service = new RateLimitService(
                new InMemoryRateLimitStore(clock, properties), properties, metrics
        );
        LoginBackoffService backoff = new LoginBackoffService(service, properties, metrics);

        assertDoesNotThrow(() -> backoff.failed("Manager@Example.com"));
        assertDoesNotThrow(() -> backoff.failed("manager@example.com"));
        assertThrows(RateLimitExceededException.class, () -> backoff.failed("manager@example.com"));
        assertThrows(RateLimitExceededException.class, () -> backoff.check("manager@example.com"));
        assertDoesNotThrow(() -> backoff.check("another-manager@example.com"));

        backoff.succeeded("manager@example.com");
        assertDoesNotThrow(() -> backoff.check("manager@example.com"));
        assertDoesNotThrow(() -> backoff.failed("manager@example.com"));
    }
}
