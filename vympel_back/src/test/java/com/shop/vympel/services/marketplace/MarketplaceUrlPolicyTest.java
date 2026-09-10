package com.shop.vympel.services.marketplace;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MarketplaceUrlPolicyTest {

    @Test
    void preservesValidatedKaspiProductSourceLinks() {
        assertEquals(
                "https://kaspi.kz/shop/p/example?merchant=123",
                MarketplaceUrlPolicy.canonicalizeKaspi("https://kaspi.kz/shop/p/example?merchant=123#offers")
        );
        assertEquals(MarketplaceUrlPolicy.KASPI_URL, MarketplaceUrlPolicy.canonicalizeKaspi(MarketplaceUrlPolicy.KASPI_URL));
    }

    @Test
    void preservesAValidatedCanonicalWildberriesProductLink() {
        assertEquals(
                "https://global.wildberries.ru/catalog/123/detail.aspx",
                MarketplaceUrlPolicy.canonicalizeWildberries("https://www.wildberries.ru/catalog/123/detail.aspx?targetUrl=GP#details")
        );
        assertEquals(
                MarketplaceUrlPolicy.WILDBERRIES_URL,
                MarketplaceUrlPolicy.canonicalizeWildberries(MarketplaceUrlPolicy.WILDBERRIES_URL)
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
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeWildberries("https://evil.wildberries.ru/catalog/123/detail.aspx")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeWildberries("http://wildberries.ru/catalog/123/detail.aspx")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeWildberries("https://wildberries.ru/seller/123")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeKaspi("http://kaspi.kz/shop/p/example")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeKaspi("https://evil.kaspi.kz/shop/p/example")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketplaceUrlPolicy.canonicalizeKaspi("https://kaspi.kz/shop/c/example")
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
