package com.shop.vympel.logging;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class DedicatedLogRoutingTest {

    @Test
    void emitsSecurityAndCrmActionEventsThroughDedicatedLoggers() {
        assertDoesNotThrow(() -> {
            SecurityAuditLogger.jwtRejected("test_invalid_token");
            CrmActionFileLogger.failure("PATCH", "/api/crm/test-logging", 400);
        });
    }
}
