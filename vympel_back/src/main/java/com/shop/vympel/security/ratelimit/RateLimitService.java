package com.shop.vympel.security.ratelimit;

import com.shop.vympel.logging.SecurityAuditLogger;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HexFormat;

@Service
public class RateLimitService {
    private static final int MAX_IDENTITY_LENGTH = 512;

    private final RateLimitStore store;
    private final RateLimitProperties properties;
    private final MeterRegistry meterRegistry;
    private final SecretKeySpec hmacKey;

    public RateLimitService(
            RateLimitStore store,
            RateLimitProperties properties,
            MeterRegistry meterRegistry
    ) {
        this.store = store;
        this.properties = properties;
        this.meterRegistry = meterRegistry;
        String hmacSecret = properties.getHmacSecret();
        if (properties.isEnabled() && (hmacSecret == null || hmacSecret.isBlank())) {
            throw new IllegalStateException("Rate-limit HMAC secret is required when rate limiting is enabled");
        }
        this.hmacKey = new SecretKeySpec(
                (hmacSecret == null ? "disabled-rate-limit-hmac-key" : hmacSecret)
                        .getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        );
    }

    public RateLimitDecision evaluate(String policyName, String identityCategory, String rawIdentity) {
        if (!properties.isEnabled()) {
            return new RateLimitDecision(true, 0, 0);
        }
        RateLimitProperties.Policy policy = policy(policyName);
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            RateLimitDecision decision = store.consume(
                    key(policyName, rawIdentity),
                    policy.getCapacity(),
                    Duration.ofSeconds(policy.getWindowSeconds())
            );
            String outcome = decision.allowed() ? "allowed" : "rejected";
            meterRegistry.counter("rate_limit_" + outcome + "_total", "policy", policyName).increment();
            if (!decision.allowed()) {
                SecurityAuditLogger.rateLimitRejected(policyName, identityCategory);
            }
            return decision;
        } catch (RateLimitStoreUnavailableException ex) {
            return onStoreFailure(policyName, policy, ex);
        } catch (RuntimeException ex) {
            return onStoreFailure(policyName, policy,
                    new RateLimitStoreUnavailableException("Rate-limit store operation failed", ex));
        } finally {
            sample.stop(meterRegistry.timer("rate_limit_latency", "policy", policyName));
        }
    }

    public void enforce(String policyName, String identityCategory, String rawIdentity) {
        RateLimitDecision decision = evaluate(policyName, identityCategory, rawIdentity);
        if (!decision.allowed()) {
            throw new RateLimitExceededException(policyName, decision.retryAfterSeconds());
        }
    }

    public void block(String namespace, String rawIdentity, Duration duration) {
        if (!properties.isEnabled()) {
            return;
        }
        try {
            store.block(key(namespace, rawIdentity), duration);
        } catch (RuntimeException ex) {
            throw directStoreFailure(namespace, ex);
        }
    }

    public long retryAfterSeconds(String namespace, String rawIdentity) {
        if (!properties.isEnabled()) {
            return 0;
        }
        try {
            return store.retryAfterSeconds(key(namespace, rawIdentity));
        } catch (RuntimeException ex) {
            throw directStoreFailure(namespace, ex);
        }
    }

    public void reset(String namespace, String rawIdentity) {
        if (!properties.isEnabled()) {
            return;
        }
        try {
            store.reset(key(namespace, rawIdentity));
        } catch (RuntimeException ex) {
            throw directStoreFailure(namespace, ex);
        }
    }

    private RateLimitDecision onStoreFailure(
            String policyName,
            RateLimitProperties.Policy policy,
            RateLimitStoreUnavailableException exception
    ) {
        meterRegistry.counter("rate_limit_store_errors_total", "policy", policyName).increment();
        SecurityAuditLogger.rateLimitStoreFailure(policyName, policy.isFailOpen());
        if (policy.isFailOpen()) {
            return new RateLimitDecision(true, 0, 0);
        }
        throw exception;
    }

    private RateLimitProperties.Policy policy(String name) {
        RateLimitProperties.Policy policy = properties.getPolicies().get(name);
        if (policy == null) {
            throw new IllegalStateException("Unknown rate-limit policy: " + name);
        }
        return policy;
    }

    private RateLimitStoreUnavailableException directStoreFailure(String namespace, RuntimeException exception) {
        meterRegistry.counter("rate_limit_store_errors_total", "policy", namespace).increment();
        SecurityAuditLogger.rateLimitStoreFailure(namespace, false);
        if (exception instanceof RateLimitStoreUnavailableException unavailable) {
            return unavailable;
        }
        return new RateLimitStoreUnavailableException("Rate-limit store operation failed", exception);
    }

    private String key(String namespace, String rawIdentity) {
        String identity = rawIdentity == null ? "unknown" : rawIdentity;
        if (identity.length() > MAX_IDENTITY_LENGTH) {
            identity = identity.substring(0, MAX_IDENTITY_LENGTH);
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(hmacKey);
            byte[] digest = mac.doFinal((namespace + "\0" + identity).getBytes(StandardCharsets.UTF_8));
            return properties.getKeyPrefix() + ":" + namespace + ":" + HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Rate-limit HMAC initialization failed", ex);
        }
    }
}
