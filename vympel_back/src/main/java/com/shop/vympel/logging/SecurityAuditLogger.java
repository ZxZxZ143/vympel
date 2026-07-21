package com.shop.vympel.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public final class SecurityAuditLogger {
    public static final String LOGGER_NAME = "SECURITY_AUDIT";

    private static final Logger LOG = LoggerFactory.getLogger(LOGGER_NAME);
    private static final ConcurrentHashMap<String, AtomicLong> REJECTION_COUNTS = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, AtomicLong> STORE_FAILURE_COUNTS = new ConcurrentHashMap<>();

    private SecurityAuditLogger() {
    }

    public static void loginFailed(String email, String reason) {
        LOG.warn(
                "event=LOGIN_FAILED principal={} reason={}",
                SensitiveDataMasker.maskEmail(email),
                SensitiveDataMasker.sanitizeForLog(reason)
        );
    }

    public static void loginSucceeded(Long userId, String roles) {
        LOG.info(
                "event=LOGIN_SUCCEEDED authenticatedUserId={} authenticatedRoles={}",
                userId,
                SensitiveDataMasker.sanitizeForLog(roles)
        );
    }

    public static void jwtRejected(String reason) {
        LOG.warn(
                "event=JWT_REJECTED reason={}",
                SensitiveDataMasker.sanitizeForLog(reason)
        );
    }

    public static void unauthorizedAccess() {
        LOG.warn("event=UNAUTHORIZED_ACCESS status=401");
    }

    public static void forbiddenAccess() {
        LOG.warn("event=FORBIDDEN_ACCESS status=403");
    }

    public static void refreshTokenReuseDetected(Long userId, String familyId) {
        LOG.warn(
                "event=REFRESH_TOKEN_REUSE_DETECTED authenticatedUserId={} sessionFamilyId={}",
                userId,
                SensitiveDataMasker.sanitizeForLog(familyId)
        );
    }

    public static void rateLimitRejected(String policy, String identityCategory) {
        long count = REJECTION_COUNTS.computeIfAbsent(policy, ignored -> new AtomicLong()).incrementAndGet();
        if (!shouldSample(count)) {
            return;
        }
        LOG.warn(
                "event=RATE_LIMIT_REJECTED policy={} identityCategory={} sampledCount={}",
                SensitiveDataMasker.sanitizeForLog(policy),
                SensitiveDataMasker.sanitizeForLog(identityCategory),
                count
        );
    }

    public static void rateLimitStoreFailure(String policy, boolean failOpen) {
        long count = STORE_FAILURE_COUNTS.computeIfAbsent(policy, ignored -> new AtomicLong()).incrementAndGet();
        if (!shouldSample(count)) {
            return;
        }
        LOG.error(
                "event=RATE_LIMIT_STORE_FAILURE policy={} failureMode={} sampledCount={}",
                SensitiveDataMasker.sanitizeForLog(policy),
                failOpen ? "FAIL_OPEN" : "FAIL_CLOSED",
                count
        );
    }

    public static void loginBackoff(String identityCategory, long retryAfterSeconds) {
        LOG.warn(
                "event=LOGIN_BACKOFF identityCategory={} retryAfterSeconds={}",
                SensitiveDataMasker.sanitizeForLog(identityCategory),
                retryAfterSeconds
        );
    }

    private static boolean shouldSample(long count) {
        return count == 1 || (count & (count - 1)) == 0;
    }
}
