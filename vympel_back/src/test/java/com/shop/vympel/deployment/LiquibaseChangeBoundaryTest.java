package com.shop.vympel.deployment;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LiquibaseChangeBoundaryTest {
    @Test
    void derivesTheLatestChangeFromThePackagedMasterChangelog() {
        assertEquals(
                new LiquibaseChangeBoundary.ChangeIdentity(
                        "2026-09-03-01-watch-product-characteristics",
                        "codex",
                        "db/changelog/2026-09-03-01-watch-product-characteristics.xml"
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
