package com.shop.vympel.db;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AppellaBrandMigrationContractTest {
    private static final String CHANGELOG =
            "db/changelog/2026-07-30-02-appella-and-contact-banners.xml";

    @Test
    void renamesTheExistingBrandWithoutReplacingItsIdentityOrProductRelations() throws IOException {
        String migration = migrationText();
        String normalized = migration.toLowerCase();

        assertTrue(normalized.contains("update brand"));
        assertTrue(normalized.contains("set code = 'appella'"));
        assertTrue(normalized.contains("where code = 'apella'"));
        assertFalse(normalized.contains("brand_i18n"),
                "brand_i18n was removed by an earlier applied migration");
        assertFalse(normalized.matches("(?s).*delete\\s+from\\s+brand\\b.*"));
        assertFalse(normalized.matches("(?s).*insert\\s+into\\s+brand\\b.*"));
        assertFalse(normalized.matches("(?s).*update\\s+product\\b.*"));
    }

    @Test
    void keepsTheMigrationForwardOnlyAndUpdatesBothContactBannerAssignments() throws IOException {
        String migration = migrationText();

        assertTrue(migration.contains("2026-07-30-02-rename-apella-brand-to-appella"));
        assertTrue(migration.contains("/contact-banner-catalog.png"));
        assertTrue(migration.contains("/contact-banner-about-page.png"));
        assertTrue(migration.contains("2026-07-30-02-restore-rhythm-png-media"));
        assertTrue(migration.contains("SET public_url = '/rhythm.png'"));
        assertTrue(migration.contains("catalog.contactBanner"));
        assertTrue(migration.contains("about.cooperationBanner"));
        assertFalse(migration.contains("<rollback>"));
    }

    private String migrationText() throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(CHANGELOG)) {
            assertNotNull(stream, "Migration must be available on the test classpath");
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
