package com.shop.vympel.security.ratelimit;

public class RateLimitStoreUnavailableException extends RuntimeException {
    public RateLimitStoreUnavailableException(String message) {
        super(message);
    }

    public RateLimitStoreUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
