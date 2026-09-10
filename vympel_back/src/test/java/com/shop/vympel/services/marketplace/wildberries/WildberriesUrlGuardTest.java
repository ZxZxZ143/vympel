package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.exceptions.ProductImportException;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.URI;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WildberriesUrlGuardTest {
    private final WildberriesUrlGuard guard = new WildberriesUrlGuard(host -> new InetAddress[]{
            InetAddress.getByAddress(host, new byte[]{93, (byte) 184, (byte) 216, 34})
    });

    @Test
    void acceptsOnlySupportedProductPagesAndProducesOneCanonicalUrl() {
        assertEquals(
                "https://global.wildberries.ru/catalog/320159542/detail.aspx",
                guard.validateProductUrl(
                        "https://www.wildberries.ru/catalog/320159542/detail.aspx?targetUrl=GP"
                ).canonicalUrl().toString()
        );
        assertEquals(320159542L, guard.validateProductUrl(
                "https://global.wildberries.ru/catalog/320159542/detail.aspx"
        ).productId());

        assertCode("WILDBERRIES_URL_INVALID", "http://wildberries.ru/catalog/42/detail.aspx");
        assertCode("WILDBERRIES_URL_INVALID", "https://user@wildberries.ru/catalog/42/detail.aspx");
        assertCode("WILDBERRIES_URL_INVALID", "https://wildberries.ru:8443/catalog/42/detail.aspx");
        assertCode("WILDBERRIES_HOST_UNSUPPORTED", "https://evil.wildberries.ru/catalog/42/detail.aspx");
        assertCode("WILDBERRIES_URL_UNSUPPORTED", "https://wildberries.ru/seller/42");
        assertCode("WILDBERRIES_URL_UNSUPPORTED", "https://wildberries.ru/catalog/not-a-number/detail.aspx");
        assertCode("WILDBERRIES_URL_INVALID", "://wildberries.ru/catalog/42/detail.aspx");
    }

    @Test
    void rejectsPrivateAndDocumentationDnsAnswers() throws Exception {
        for (String address : new String[]{"127.0.0.1", "10.0.0.1", "169.254.169.254", "100.64.0.1", "2001:db8::1"}) {
            WildberriesUrlGuard blocked = new WildberriesUrlGuard(
                    host -> new InetAddress[]{InetAddress.getByName(address)}
            );
            ProductImportException error = assertThrows(
                    ProductImportException.class,
                    () -> blocked.validateProductUrl("https://wildberries.ru/catalog/42/detail.aspx")
            );
            assertEquals("WILDBERRIES_ADDRESS_BLOCKED", error.getCode());
        }
    }

    @Test
    void permitsOnlyTheExpectedCdnRedirectPathAndHost() {
        URI current = URI.create("https://alm-basket-cdn-04.geobasket.net"
                + WildberriesUrlGuard.detailsPath(320159542L));
        URI allowed = guard.resolveDetailsRedirect(
                current,
                "https://basket-19.wbbasket.ru" + WildberriesUrlGuard.detailsPath(320159542L),
                320159542L
        );
        assertEquals("basket-19.wbbasket.ru", allowed.getHost());

        assertRedirectRejected(current, "https://example.com/internal");
        assertRedirectRejected(current, "https://basket-19.wbbasket.ru/other.json");
        assertRedirectRejected(current, "http://basket-19.wbbasket.ru" + WildberriesUrlGuard.detailsPath(320159542L));
    }

    private void assertCode(String code, String url) {
        ProductImportException error = assertThrows(ProductImportException.class, () -> guard.validateProductUrl(url));
        assertEquals(code, error.getCode());
    }

    private void assertRedirectRejected(URI current, String location) {
        ProductImportException error = assertThrows(
                ProductImportException.class,
                () -> guard.resolveDetailsRedirect(current, location, 320159542L)
        );
        assertEquals("WILDBERRIES_REDIRECT_REJECTED", error.getCode());
    }
}
