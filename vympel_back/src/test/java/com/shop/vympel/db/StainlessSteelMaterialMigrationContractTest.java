package com.shop.vympel.db;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StainlessSteelMaterialMigrationContractTest {
    private static final String CHANGELOG =
            "db/changelog/2026-08-31-01-stainless-steel-material.xml";
    private static final String MASTER_CHANGELOG =
            "db/changelog/db.changelog-master.xml";

    @Test
    void seedsTheDistinctLocalizedMaterialIdempotentlyAndPreservesSteel() throws IOException {
        String migration = resourceText(CHANGELOG);
        String normalized = migration.replaceAll("\\s+", " ");

        assertTrue(normalized.contains("VALUES ('STAINLESS_STEEL', 'CASE', true)"));
        assertTrue(normalized.contains("ON CONFLICT (code) DO UPDATE"));
        assertTrue(normalized.contains("ON CONFLICT (material_id, lang) DO UPDATE"));
        assertTrue(normalized.contains("('ru', 'Нержавеющая сталь')"));
        assertTrue(normalized.contains("('kk', 'Тот баспайтын болат')"));
        assertTrue(normalized.contains("('en', 'Stainless steel')"));
        assertFalse(normalized.contains("WHERE material.code = 'STEEL'"));
        assertFalse(normalized.contains("DELETE FROM material WHERE code = 'STEEL'"));
    }

    @Test
    void isIncludedAfterThePreviousMigrationAndHasAnFkSafeRollback() throws IOException {
        String master = resourceText(MASTER_CHANGELOG);
        String migration = resourceText(CHANGELOG).replaceAll("\\s+", " ");
        String previous = "db/changelog/2026-08-27-01-optional-product-characteristics.xml";
        String current = "db/changelog/2026-08-31-01-stainless-steel-material.xml";

        assertTrue(master.indexOf(current) > master.indexOf(previous));
        assertTrue(migration.contains("<rollback>"));
        assertTrue(migration.contains("DELETE FROM material WHERE code = 'STAINLESS_STEEL';"));
        assertFalse(migration.toLowerCase().contains("cascade"));
        assertFalse(migration.toLowerCase().contains("delete from watch_details"));
        assertTrue(migration.contains("DROP CONSTRAINT IF EXISTS chk_product_kaspi_url_canonical"));
        assertTrue(migration.contains("https://(www\\.)?kaspi\\.kz/shop/p/"));
    }

    private String resourceText(String path) throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(path)) {
            assertNotNull(stream, "Migration must be available on the test classpath: " + path);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
