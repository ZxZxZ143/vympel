package com.shop.vympel.security.ratelimit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(prefix = "security.rate-limit", name = "storage", havingValue = "memory")
public class InMemoryRateLimitStore implements RateLimitStore {
    private final Map<String, Entry> entries = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxEntries;

    public InMemoryRateLimitStore(Clock clock, RateLimitProperties properties) {
        this.clock = clock;
        this.maxEntries = properties.getMaxLocalEntries();
    }

    @Override
    public synchronized RateLimitDecision consume(String key, long capacity, Duration window) {
        Instant now = clock.instant();
        ensureCapacity(key, now);
        Entry entry = entries.compute(key, (ignored, current) -> {
            if (current == null || !current.expiresAt().isAfter(now)) {
                return new Entry(1, now.plus(window));
            }
            return new Entry(current.count() + 1, current.expiresAt());
        });
        long retryAfter = secondsUntil(now, entry.expiresAt());
        return new RateLimitDecision(entry.count() <= capacity, entry.count(), retryAfter);
    }

    @Override
    public synchronized long retryAfterSeconds(String key) {
        Instant now = clock.instant();
        Entry entry = entries.get(key);
        if (entry == null || !entry.expiresAt().isAfter(now)) {
            entries.remove(key, entry);
            return 0;
        }
        return secondsUntil(now, entry.expiresAt());
    }

    @Override
    public synchronized void block(String key, Duration duration) {
        Instant now = clock.instant();
        ensureCapacity(key, now);
        Instant requestedExpiry = now.plus(duration);
        entries.compute(key, (ignored, current) -> current == null || current.expiresAt().isBefore(requestedExpiry)
                ? new Entry(1, requestedExpiry)
                : current);
    }

    @Override
    public synchronized void reset(String key) {
        entries.remove(key);
    }

    synchronized int size() {
        return entries.size();
    }

    private void ensureCapacity(String key, Instant now) {
        if (entries.containsKey(key) || entries.size() < maxEntries) {
            return;
        }
        entries.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
        if (entries.size() >= maxEntries) {
            throw new RateLimitStoreUnavailableException("Local rate-limit state is at capacity");
        }
    }

    private long secondsUntil(Instant now, Instant expiresAt) {
        long millis = Math.max(1, Duration.between(now, expiresAt).toMillis());
        return Math.max(1, (millis + 999) / 1000);
    }

    private record Entry(long count, Instant expiresAt) {
    }
}
