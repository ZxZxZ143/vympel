package com.shop.vympel.security.ratelimit;

import java.time.Duration;

public interface RateLimitStore {
    RateLimitDecision consume(String key, long capacity, Duration window);

    long retryAfterSeconds(String key);

    void block(String key, Duration duration);

    void reset(String key);
}
