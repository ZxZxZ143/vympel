package com.shop.vympel.security.ratelimit;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitServiceTest {
    @Test
    void enforcesCapacityResetsAfterWindowAndKeepsKeysPrivate() {
        MutableClock clock = new MutableClock(Instant.parse("2026-07-16T00:00:00Z"));
        RateLimitProperties properties = properties(2, 60);
        CapturingStore store = new CapturingStore(new InMemoryRateLimitStore(clock, properties));
        RateLimitService service = new RateLimitService(store, properties, new SimpleMeterRegistry());

        assertTrue(service.evaluate("test-policy", "source", "raw@email.example").allowed());
        assertTrue(service.evaluate("test-policy", "source", "raw@email.example").allowed());
        RateLimitDecision rejected = service.evaluate("test-policy", "source", "raw@email.example");

        assertFalse(rejected.allowed());
        assertTrue(rejected.retryAfterSeconds() > 0);
        assertFalse(store.lastKey.contains("raw@email.example"));
        assertEquals(64, store.lastKey.substring(store.lastKey.lastIndexOf(':') + 1).length());

        clock.advance(Duration.ofSeconds(61));
        assertTrue(service.evaluate("test-policy", "source", "raw@email.example").allowed());
    }

    @Test
    void concurrentRequestsCannotExceedCapacity() throws Exception {
        MutableClock clock = new MutableClock(Instant.parse("2026-07-16T00:00:00Z"));
        RateLimitProperties properties = properties(5, 60);
        InMemoryRateLimitStore store = new InMemoryRateLimitStore(clock, properties);
        RateLimitService service = new RateLimitService(store, properties, new SimpleMeterRegistry());
        var executor = Executors.newFixedThreadPool(10);
        try {
            List<Callable<Boolean>> calls = new ArrayList<>();
            for (int index = 0; index < 20; index++) {
                calls.add(() -> service.evaluate("test-policy", "source", "same-source").allowed());
            }
            long allowed = executor.invokeAll(calls).stream()
                    .filter(future -> {
                        try {
                            return future.get();
                        } catch (Exception ex) {
                            throw new RuntimeException(ex);
                        }
                    })
                    .count();
            assertEquals(5, allowed);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void isolatesDifferentIdentitiesAndPolicyNamespaces() {
        MutableClock clock = new MutableClock(Instant.parse("2026-07-16T00:00:00Z"));
        RateLimitProperties properties = properties(1, 60);
        RateLimitProperties.Policy secondPolicy = new RateLimitProperties.Policy();
        secondPolicy.setCapacity(1);
        secondPolicy.setWindowSeconds(60);
        secondPolicy.setFailOpen(false);
        properties.setPolicies(java.util.Map.of(
                "test-policy", properties.getPolicies().get("test-policy"),
                "second-policy", secondPolicy,
                "login-account-failures", properties.getPolicies().get("login-account-failures")
        ));
        RateLimitService service = new RateLimitService(
                new InMemoryRateLimitStore(clock, properties), properties, new SimpleMeterRegistry()
        );

        assertTrue(service.evaluate("test-policy", "source", "source-a").allowed());
        assertFalse(service.evaluate("test-policy", "source", "source-a").allowed());
        assertTrue(service.evaluate("test-policy", "source", "source-b").allowed());
        assertTrue(service.evaluate("second-policy", "source", "source-a").allowed());
    }

    @Test
    void failClosedPolicyDoesNotSilentlyDisableProtection() {
        RateLimitProperties properties = properties(1, 60);
        RateLimitStore brokenStore = new RateLimitStore() {
            @Override public RateLimitDecision consume(String key, long capacity, Duration window) {
                throw new RateLimitStoreUnavailableException("down");
            }
            @Override public long retryAfterSeconds(String key) { throw new RateLimitStoreUnavailableException("down"); }
            @Override public void block(String key, Duration duration) { throw new RateLimitStoreUnavailableException("down"); }
            @Override public void reset(String key) { throw new RateLimitStoreUnavailableException("down"); }
        };
        RateLimitService service = new RateLimitService(brokenStore, properties, new SimpleMeterRegistry());

        assertThrows(RateLimitStoreUnavailableException.class,
                () -> service.evaluate("test-policy", "source", "source"));
    }

    @Test
    void failOpenPolicyRecordsStoreFailureAndAllowsAvailabilityPath() {
        RateLimitProperties properties = properties(1, 60);
        properties.getPolicies().get("test-policy").setFailOpen(true);
        SimpleMeterRegistry metrics = new SimpleMeterRegistry();
        RateLimitStore brokenStore = new RateLimitStore() {
            @Override public RateLimitDecision consume(String key, long capacity, Duration window) {
                throw new RateLimitStoreUnavailableException("down");
            }
            @Override public long retryAfterSeconds(String key) { throw new RateLimitStoreUnavailableException("down"); }
            @Override public void block(String key, Duration duration) { throw new RateLimitStoreUnavailableException("down"); }
            @Override public void reset(String key) { throw new RateLimitStoreUnavailableException("down"); }
        };
        RateLimitService service = new RateLimitService(brokenStore, properties, metrics);

        assertTrue(service.evaluate("test-policy", "source", "source").allowed());
        assertEquals(1.0, metrics.counter("rate_limit_store_errors_total", "policy", "test-policy").count());
    }

    @Test
    void directBackoffStoreOperationsFailClosedWithTheSafeStoreException() {
        RateLimitProperties properties = properties(1, 60);
        SimpleMeterRegistry metrics = new SimpleMeterRegistry();
        RateLimitStore brokenStore = new RateLimitStore() {
            @Override public RateLimitDecision consume(String key, long capacity, Duration window) {
                throw new IllegalStateException("redis password must not escape");
            }
            @Override public long retryAfterSeconds(String key) {
                throw new IllegalStateException("redis password must not escape");
            }
            @Override public void block(String key, Duration duration) {
                throw new IllegalStateException("redis password must not escape");
            }
            @Override public void reset(String key) {
                throw new IllegalStateException("redis password must not escape");
            }
        };
        RateLimitService service = new RateLimitService(brokenStore, properties, metrics);

        RateLimitStoreUnavailableException exception = assertThrows(
                RateLimitStoreUnavailableException.class,
                () -> service.retryAfterSeconds("login-account-backoff", "manager@example.com")
        );

        assertEquals("Rate-limit store operation failed", exception.getMessage());
        assertEquals(1.0, metrics.counter(
                "rate_limit_store_errors_total", "policy", "login-account-backoff"
        ).count());
    }

    @Test
    void explicitlyDisabledLocalLimiterNeedsNoSecretAndPerformsNoStoreOperations() {
        RateLimitProperties properties = properties(1, 60);
        properties.setEnabled(false);
        properties.setHmacSecret(null);
        RateLimitStore brokenStore = new RateLimitStore() {
            @Override public RateLimitDecision consume(String key, long capacity, Duration window) {
                throw new AssertionError("disabled limiter must not consume");
            }
            @Override public long retryAfterSeconds(String key) {
                throw new AssertionError("disabled limiter must not read state");
            }
            @Override public void block(String key, Duration duration) {
                throw new AssertionError("disabled limiter must not block");
            }
            @Override public void reset(String key) {
                throw new AssertionError("disabled limiter must not reset");
            }
        };
        RateLimitService service = new RateLimitService(brokenStore, properties, new SimpleMeterRegistry());

        assertTrue(service.evaluate("missing-policy-is-not-read", "source", "source").allowed());
        assertEquals(0, service.retryAfterSeconds("login-account-backoff", "source"));
        service.block("login-account-backoff", "source", Duration.ofSeconds(30));
        service.reset("login-account-backoff", "source");
    }

    private RateLimitProperties properties(long capacity, long windowSeconds) {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setStorage("memory");
        properties.setHmacSecret("test-rate-limit-hmac-secret-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        RateLimitProperties.Policy policy = new RateLimitProperties.Policy();
        policy.setCapacity(capacity);
        policy.setWindowSeconds(windowSeconds);
        policy.setFailOpen(false);
        properties.setPolicies(java.util.Map.of("test-policy", policy, "login-account-failures", policy));
        return properties;
    }

    private static final class CapturingStore implements RateLimitStore {
        private final RateLimitStore delegate;
        private String lastKey;

        private CapturingStore(RateLimitStore delegate) {
            this.delegate = delegate;
        }

        @Override public RateLimitDecision consume(String key, long capacity, Duration window) {
            lastKey = key;
            return delegate.consume(key, capacity, window);
        }
        @Override public long retryAfterSeconds(String key) { lastKey = key; return delegate.retryAfterSeconds(key); }
        @Override public void block(String key, Duration duration) { lastKey = key; delegate.block(key, duration); }
        @Override public void reset(String key) { lastKey = key; delegate.reset(key); }
    }

    static final class MutableClock extends Clock {
        private final AtomicReference<Instant> instant;

        MutableClock(Instant instant) {
            this.instant = new AtomicReference<>(instant);
        }

        void advance(Duration duration) {
            instant.updateAndGet(value -> value.plus(duration));
        }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant.get(); }
    }
}
