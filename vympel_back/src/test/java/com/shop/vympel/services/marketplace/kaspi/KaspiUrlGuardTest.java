package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.exceptions.ProductImportException;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class KaspiUrlGuardTest {
    private final KaspiUrlGuard guard = new KaspiUrlGuard(host -> new InetAddress[]{
            InetAddress.getByAddress(host, new byte[]{93, (byte) 184, (byte) 216, 34})
    });

    @Test
    void acceptsOnlyNormalizedHttpsKaspiProductUrls() {
        assertEquals(
                "https://www.kaspi.kz/shop/p/watch-123/?merchant=42",
                guard.validate("https://WWW.KASPI.KZ/shop/p/watch-123/?merchant=42#offers").uri().toString()
        );

        assertCode("KASPI_URL_INVALID", "http://kaspi.kz/shop/p/watch-123");
        assertCode("KASPI_URL_INVALID", "https://user@kaspi.kz/shop/p/watch-123");
        assertCode("KASPI_URL_INVALID", "https://kaspi.kz:8443/shop/p/watch-123");
        assertCode("KASPI_HOST_UNSUPPORTED", "https://evil.kaspi.kz/shop/p/watch-123");
        assertCode("KASPI_HOST_UNSUPPORTED", "https://example.com/shop/p/watch-123");
        assertCode("KASPI_HOST_UNSUPPORTED", "https://kaspi.kz./shop/p/watch-123");
        assertCode("KASPI_URL_UNSUPPORTED", "https://kaspi.kz/shop/c/watches");
        assertCode("KASPI_URL_INVALID", "https://kaspi.kz/shop/p/" + "x".repeat(2048));
    }

    @Test
    void rejectsPrivateLoopbackLinkLocalAndCarrierGradeNatAnswers() throws Exception {
        for (String address : new String[]{
                "127.0.0.1", "10.0.0.1", "169.254.169.254", "100.64.0.1",
                "192.0.2.1", "198.18.0.1", "198.51.100.1", "203.0.113.1",
                "::1", "fc00::1", "2001:db8::1", "64:ff9b::7f00:1"
        }) {
            KaspiUrlGuard blocked = new KaspiUrlGuard(host -> new InetAddress[]{InetAddress.getByName(address)});
            ProductImportException error = assertThrows(
                    ProductImportException.class,
                    () -> blocked.validate("https://kaspi.kz/shop/p/watch-123")
            );
            assertEquals("KASPI_ADDRESS_BLOCKED", error.getCode());
        }
    }

    @Test
    void validatesEveryRedirectAndRejectsCrossHostOrNonProductDestinations() {
        SecureKaspiPageFetcher fetcher = new SecureKaspiPageFetcher(guard, mock(HttpClient.class));
        URI current = URI.create("https://kaspi.kz/shop/p/watch-123");

        assertEquals(
                "https://www.kaspi.kz/shop/p/watch-456",
                fetcher.validatedRedirect(current, Optional.of("https://www.kaspi.kz/shop/p/watch-456")).toString()
        );
        ProductImportException crossHost = assertThrows(
                ProductImportException.class,
                () -> fetcher.validatedRedirect(current, Optional.of("https://example.com/internal"))
        );
        assertEquals("KASPI_REDIRECT_REJECTED", crossHost.getCode());
        ProductImportException categoryRedirect = assertThrows(
                ProductImportException.class,
                () -> fetcher.validatedRedirect(current, Optional.of("/shop/c/watches"))
        );
        assertEquals("KASPI_REDIRECT_REJECTED", categoryRedirect.getCode());
    }

    private void assertCode(String code, String url) {
        ProductImportException error = assertThrows(ProductImportException.class, () -> guard.validate(url));
        assertEquals(code, error.getCode());
    }
}
