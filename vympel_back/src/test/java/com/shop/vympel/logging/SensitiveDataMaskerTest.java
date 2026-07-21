package com.shop.vympel.logging;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SensitiveDataMaskerTest {

    @Test
    void masksSecretsBearerTokensJwtValuesAndUriCredentials() {
        String value = """
                password=plain-secret Authorization: Bearer abc.def.ghi \
                refresh_token="refresh-secret" \
                jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signaturevalue123 \
                postgresql://admin:database-secret@db.internal/vympel
                """;

        String masked = SensitiveDataMasker.mask(value);

        assertFalse(masked.contains("plain-secret"));
        assertFalse(masked.contains("refresh-secret"));
        assertFalse(masked.contains("database-secret"));
        assertFalse(masked.contains("eyJhbGciOiJIUzI1NiJ9"));
        assertTrue(masked.contains(SensitiveDataMasker.REDACTED));
    }

    @Test
    void sanitizesMetadataAndMasksEmailAddresses() {
        Map<String, Object> sanitized = SensitiveDataMasker.sanitizeMetadata(Map.of(
                "password", "never-log-me",
                "adminEmail", "Admin.User@example.com",
                "count", 3
        ));

        assertEquals(SensitiveDataMasker.REDACTED, sanitized.get("password"));
        assertEquals("a***@example.com", sanitized.get("adminEmail"));
        assertEquals(3, sanitized.get("count"));
    }

    @Test
    void rejectsTechnicalOrSensitiveClientMessages() {
        assertEquals(
                "Invalid request.",
                SensitiveDataMasker.safeClientMessage("password=secret", "Invalid request.")
        );
        assertEquals(
                "Invalid request.",
                SensitiveDataMasker.safeClientMessage("Hibernate SQL exception", "Invalid request.")
        );
        assertEquals(
                "Product not found",
                SensitiveDataMasker.safeClientMessage("Product not found", "Invalid request.")
        );
    }
}
