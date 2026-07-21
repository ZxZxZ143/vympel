package com.shop.vympel.security.ratelimit;

public class RateLimitExceededException extends RuntimeException {
    private final String policy;
    private final long retryAfterSeconds;

    public RateLimitExceededException(String policy, long retryAfterSeconds) {
        super("Rate limit exceeded");
        this.policy = policy;
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public String getPolicy() {
        return policy;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
