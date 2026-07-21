package com.shop.vympel.security.ratelimit;

public record RateLimitDecision(boolean allowed, long count, long retryAfterSeconds) {
}
