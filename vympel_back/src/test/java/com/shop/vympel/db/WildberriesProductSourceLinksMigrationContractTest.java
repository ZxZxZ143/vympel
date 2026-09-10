package com.shop.vympel.db;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WildberriesProductSourceLinksMigrationContractTest {
    private static final String CHANGELOG =
            "db/changelog/2026-09-10-01-wildberries-product-source-links.xml";
    private static final String MASTER_CHANGELOG =
            "db/changelog/db.changelog-master.xml";

    @Test
    void allowsOnlyCanonicalProductLinksAndTheHistoricalSellerRoot() throws IOException {
        String migration = resourceText(CHANGELOG).replaceAll("\\s+", " ");

        assertTrue(migration.contains("DROP CONSTRAINT IF EXISTS chk_product_wildberries_url_canonical"));
        assertTrue(migration.contains("wildberries_url = 'https://global.wildberries.ru/seller/4398117'"));
        assertTrue(migration.contains("https://global\\.wildberries\\.ru/catalog/[1-9][0-9]*/detail\\.aspx"));
        assertFalse(migration.contains("https://(www\\.)?wildberries"));
    }

    @Test
    void followsThePreviousBoundaryAndHasADataPreservingRollbackGuard() throws IOException {
        String master = resourceText(MASTER_CHANGELOG);
        String migration = resourceText(CHANGELOG).replaceAll("\\s+", " ");
        String previous = "db/changelog/2026-09-04-01-product-model-variants.xml";

        assertTrue(master.indexOf(CHANGELOG) > master.indexOf(previous));
        assertTrue(migration.contains("<rollback>"));
        assertTrue(migration.contains(
                "Cannot roll back Wildberries product source links without losing product-specific URLs"
        ));
        assertTrue(migration.contains("RAISE EXCEPTION"));
        assertFalse(migration.toLowerCase().contains("update product set wildberries_url"));
        assertFalse(migration.toLowerCase().contains("delete from product"));
    }

    private String resourceText(String path) throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(path)) {
            assertNotNull(stream, "Migration must be available on the test classpath: " + path);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
