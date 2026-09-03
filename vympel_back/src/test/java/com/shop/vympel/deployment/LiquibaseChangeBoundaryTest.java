package com.shop.vympel.deployment;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LiquibaseChangeBoundaryTest {
    @Test
    void derivesTheLatestChangeFromThePackagedMasterChangelog() {
        assertEquals(
                new LiquibaseChangeBoundary.ChangeIdentity(
                        "2026-08-31-02-kaspi-product-source-links",
                        "codex",
                        "db/changelog/2026-08-31-01-stainless-steel-material.xml"
                ),
                new LiquibaseChangeBoundary().expectedLatestChange()
        );
        assertTrue(new LiquibaseChangeBoundary().packagedChanges().contains(
                new LiquibaseChangeBoundary.ChangeIdentity(
                        "2026-02-08-04-01-seed-country",
                        "admin",
                        "db/changelog/2026-02-08-03-seed-countries.xml"
                )
        ));
    }
}
