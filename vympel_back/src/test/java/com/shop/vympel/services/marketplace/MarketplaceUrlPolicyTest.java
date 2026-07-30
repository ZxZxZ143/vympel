package com.shop.vympel.services.marketplace;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MarketplaceUrlPolicyTest {

    @Test
    void canonicalizesKaspiProductLinksToTheStorefrontDestination() {
        assertEquals(
                MarketplaceUrlPolicy.KASPI_URL,
                MarketplaceUrlPolicy.canonicalizeKaspi("https://kaspi.kz/shop/p/example")
        );
    }

    @Test
    void canonicalizesWildberriesProductLinksToTheSellerDestination() {
        assertEquals(
                MarketplaceUrlPolicy.WILDBERRIES_URL,
                MarketplaceUrlPolicy.canonicalizeWildberries("https://www.wildberries.ru/catalog/123/detail.aspx")
        );
    }

    @Test
    void keepsMissingProductMarketplaceLinksOptional() {
        assertNull(MarketplaceUrlPolicy.canonicalizeKaspi("  "));
        assertNull(MarketplaceUrlPolicy.canonicalizeWildberries(null));
    }

    @Test
    void rejectsProductUrlsFromAnotherMarketplaceDomain() {
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeKaspi("https://example.com/product")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeWildberries("https://ozon.ru/product")
        );
    }

    @Test
    void canonicalizesSupportedCmsMarketplaceLinksAndForcesOzonOut() {
        assertEquals(
                MarketplaceUrlPolicy.KASPI_URL,
                MarketplaceUrlPolicy.canonicalizeCmsExternalUrl("https://kaspi.kz/shop/p/legacy")
        );
        assertEquals(
                MarketplaceUrlPolicy.WILDBERRIES_URL,
                MarketplaceUrlPolicy.canonicalizeCmsExternalUrl("https://www.wildberries.ru/catalog/legacy")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeCmsExternalUrl("https://www.ozon.ru/product/legacy")
        );
    }

    @Test
    void leavesUnrelatedCmsExternalLinksUntouched() {
        assertEquals(
                "https://example.com/page",
                MarketplaceUrlPolicy.canonicalizeCmsExternalUrl("https://example.com/page")
        );
    }
}
