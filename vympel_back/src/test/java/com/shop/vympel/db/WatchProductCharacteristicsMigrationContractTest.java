package com.shop.vympel.db;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WatchProductCharacteristicsMigrationContractTest {
    private static final String CHANGELOG =
            "db/changelog/2026-09-03-01-watch-product-characteristics.xml";
    private static final String MASTER_CHANGELOG =
            "db/changelog/db.changelog-master.xml";

    @Test
    void addsOnlyNullableWatchColumnsAndSeedsTheRequiredBoundedDictionaries() throws IOException {
        String migration = resourceText(CHANGELOG).replaceAll("\\s+", " ");

        assertTrue(migration.contains("ADD COLUMN dial_type_id BIGINT"));
        assertTrue(migration.contains("ADD COLUMN dial_marking_id BIGINT"));
        assertTrue(migration.contains("ADD COLUMN power_source_id BIGINT"));
        assertTrue(migration.contains("ADD COLUMN water_resistance_option_id BIGINT"));
        assertTrue(migration.contains("ADD COLUMN strap_color_id BIGINT"));
        assertTrue(migration.contains("ADD COLUMN dial_color_id BIGINT"));
        assertTrue(migration.contains("ADD COLUMN package_contents VARCHAR(500)"));
        assertFalse(migration.contains("ADD COLUMN dial_type_id BIGINT NOT NULL"));
        assertTrue(migration.contains("('DIAL_TYPE', 'ANALOG', true)"));
        assertTrue(migration.contains("('DIAL_MARKING', 'MARKERS', true)"));
        assertTrue(migration.contains("('POWER_SOURCE', 'BATTERY', true)"));
        assertTrue(migration.contains("VALUES ('BACKLIGHT', true)"));
        assertTrue(migration.contains("WHEN 'ru' THEN 'Отображение даты'"));
        assertTrue(migration.contains("('BROWN', 'ru', 'Коричневый')"));
    }

    @Test
    void followsStainlessSteelAndHasGuardedNonCascadingRollback() throws IOException {
        String master = resourceText(MASTER_CHANGELOG);
        String migration = resourceText(CHANGELOG).replaceAll("\\s+", " ");
        String previous = "db/changelog/2026-08-31-01-stainless-steel-material.xml";

        assertTrue(master.indexOf(CHANGELOG) > master.indexOf(previous));
        assertTrue(migration.contains("<rollback>"));
        assertTrue(migration.contains("Cannot roll back watch characteristics while products contain new watch data"));
        assertTrue(migration.contains("Cannot roll back watch characteristics while products reference BACKLIGHT"));
        assertTrue(migration.contains("Cannot roll back watch characteristics while products reference seeded colors"));
        assertFalse(migration.toLowerCase().contains("drop table watch_attribute_option cascade"));
        assertFalse(migration.toLowerCase().contains("delete from watch_details"));
    }

    private String resourceText(String path) throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(path)) {
            assertNotNull(stream, "Migration must be available on the test classpath: " + path);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
