package com.shop.vympel.security.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InMemoryRateLimitStoreTest {
    @Test
    void boundsCardinalityAndReclaimsExpiredEntries() {
        RateLimitServiceTest.MutableClock clock = new RateLimitServiceTest.MutableClock(
                Instant.parse("2026-07-16T00:00:00Z")
        );
        RateLimitProperties properties = new RateLimitProperties();
        properties.setMaxLocalEntries(100);
        InMemoryRateLimitStore store = new InMemoryRateLimitStore(clock, properties);

        for (int index = 0; index < 100; index++) {
            assertTrue(store.consume("key-" + index, 1, Duration.ofSeconds(60)).allowed());
        }
        assertEquals(100, store.size());
        assertThrows(RateLimitStoreUnavailableException.class,
                () -> store.consume("over-capacity", 1, Duration.ofSeconds(60)));

        clock.advance(Duration.ofSeconds(61));
        assertTrue(store.consume("after-expiry", 1, Duration.ofSeconds(60)).allowed());
        assertEquals(1, store.size());
    }

    @Test
    void concurrentDistinctKeysCannotExceedTheConfiguredCardinality() throws Exception {
        RateLimitServiceTest.MutableClock clock = new RateLimitServiceTest.MutableClock(
                Instant.parse("2026-07-16T00:00:00Z")
        );
        RateLimitProperties properties = new RateLimitProperties();
        properties.setMaxLocalEntries(100);
        InMemoryRateLimitStore store = new InMemoryRateLimitStore(clock, properties);
        var executor = Executors.newFixedThreadPool(16);
        try {
            List<Callable<Boolean>> calls = new ArrayList<>();
            for (int index = 0; index < 250; index++) {
                int keyIndex = index;
                calls.add(() -> {
                    try {
                        return store.consume("concurrent-key-" + keyIndex, 1, Duration.ofSeconds(60)).allowed();
                    } catch (RateLimitStoreUnavailableException expectedAtCapacity) {
                        return false;
                    }
                });
            }

            long admitted = 0;
            for (var future : executor.invokeAll(calls)) {
                if (future.get()) {
                    admitted++;
                }
            }

            assertEquals(100, admitted);
            assertEquals(100, store.size());
        } finally {
            executor.shutdownNow();
        }
    }
}
