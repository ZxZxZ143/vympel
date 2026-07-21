package com.shop.vympel.security.ratelimit;

import com.shop.vympel.logging.SecurityAuditLogger;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;

@Service
public class LoginBackoffService {
    private static final String BACKOFF_NAMESPACE = "login-account-backoff";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;
    private final MeterRegistry meterRegistry;

    public LoginBackoffService(
            RateLimitService rateLimitService,
            RateLimitProperties properties,
            MeterRegistry meterRegistry
    ) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
        this.meterRegistry = meterRegistry;
    }

    public void check(String rawLogin) {
        String login = normalizedLogin(rawLogin);
        long retryAfter = rateLimitService.retryAfterSeconds(BACKOFF_NAMESPACE, login);
        if (retryAfter > 0) {
            meterRegistry.counter("login_backoff_total").increment();
            SecurityAuditLogger.loginBackoff("account", retryAfter);
            throw new RateLimitExceededException(BACKOFF_NAMESPACE, retryAfter);
        }
    }

    public void failed(String rawLogin) {
        String login = normalizedLogin(rawLogin);
        RateLimitDecision decision = rateLimitService.evaluate("login-account-failures", "account", login);
        if (!decision.allowed()) {
            rateLimitService.block(BACKOFF_NAMESPACE, login,
                    Duration.ofSeconds(properties.getLoginBackoffMaxSeconds()));
            throw new RateLimitExceededException("login-account-failures", decision.retryAfterSeconds());
        }

        if (decision.count() >= properties.getLoginBackoffThreshold()) {
            long exponent = Math.min(20, decision.count() - properties.getLoginBackoffThreshold());
            long seconds = Math.min(
                    properties.getLoginBackoffMaxSeconds(),
                    properties.getLoginBackoffBaseSeconds() * (1L << exponent)
            );
            rateLimitService.block(BACKOFF_NAMESPACE, login, Duration.ofSeconds(seconds));
            meterRegistry.counter("login_backoff_total").increment();
            SecurityAuditLogger.loginBackoff("account", seconds);
            throw new RateLimitExceededException(BACKOFF_NAMESPACE, seconds);
        }
    }

    public void succeeded(String rawLogin) {
        String login = normalizedLogin(rawLogin);
        rateLimitService.reset("login-account-failures", login);
        rateLimitService.reset(BACKOFF_NAMESPACE, login);
    }

    private String normalizedLogin(String value) {
        if (value == null) {
            return "missing";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.length() <= 254 ? normalized : normalized.substring(0, 254);
    }
}
