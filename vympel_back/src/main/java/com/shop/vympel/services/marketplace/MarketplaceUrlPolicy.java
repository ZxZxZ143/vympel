package com.shop.vympel.services.marketplace;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

public final class MarketplaceUrlPolicy {
    public static final String KASPI_URL =
            "https://kaspi.kz/shop/m/1433003/products?productCode=110688026&masterSku=110688026&merchantSku=AM%2b003%2bH%2bBRONZE&tabId=PRODUCT&started_by=shop_product&ref=shared_link&sessionId=b58a609e-9e07-4c3b-b683-fcf5ccec61d51785317673&link_source=chrome";
    public static final String WILDBERRIES_URL = "https://global.wildberries.ru/seller/4398117";

    private MarketplaceUrlPolicy() {
    }

    public static String canonicalizeKaspi(String url) {
        if (url == null || url.trim().isBlank()) {
            return null;
        }
        if (KASPI_URL.equals(url.trim())) {
            return KASPI_URL;
        }
        URI uri = parseRequiredHttpUrl(url, "kaspiUrl");
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (!"https".equalsIgnoreCase(uri.getScheme())
                || !("kaspi.kz".equals(host) || "www.kaspi.kz".equals(host))
                || uri.getRawUserInfo() != null
                || (uri.getPort() != -1 && uri.getPort() != 443)
                || uri.getPath() == null
                || !uri.getPath().startsWith("/shop/p/")
                || uri.getPath().length() <= "/shop/p/".length()) {
            throw new IllegalArgumentException("kaspiUrl must point to a Kaspi product page");
        }
        try {
            return new URI("https", null, host, -1, uri.getRawPath(), uri.getRawQuery(), null).toString();
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("kaspiUrl must be a valid URL");
        }
    }

    public static String canonicalizeWildberries(String url) {
        return canonicalizeProductUrl(url, "wildberriesUrl", "wildberries.ru", WILDBERRIES_URL);
    }

    public static String canonicalizeCmsExternalUrl(String url) {
        URI uri = parseRequiredHttpUrl(url, "CMS link target");
        String hostname = uri.getHost().toLowerCase(Locale.ROOT);

        if (isHostWithinDomain(hostname, "ozon.ru") || isHostWithinDomain(hostname, "ozon.kz")) {
            throw new IllegalArgumentException("Ozon marketplace links are not supported");
        }
        if (isHostWithinDomain(hostname, "kaspi.kz")) {
            return KASPI_URL;
        }
        if (isHostWithinDomain(hostname, "wildberries.ru")) {
            return WILDBERRIES_URL;
        }

        return uri.toString();
    }

    public static boolean isCanonicalMarketplaceUrl(String url) {
        return KASPI_URL.equals(url) || WILDBERRIES_URL.equals(url);
    }

    private static String canonicalizeProductUrl(
            String url,
            String fieldName,
            String expectedDomain,
            String canonicalUrl
    ) {
        if (url == null || url.trim().isBlank()) {
            return null;
        }

        URI uri = parseRequiredHttpUrl(url, fieldName);
        String normalizedHost = uri.getHost().toLowerCase(Locale.ROOT);
        if (!isHostWithinDomain(normalizedHost, expectedDomain)) {
            throw new IllegalArgumentException(fieldName + " must point to " + expectedDomain);
        }

        return canonicalUrl;
    }

    private static URI parseRequiredHttpUrl(String url, String fieldName) {
        if (url == null || url.trim().isBlank()) {
            throw new IllegalArgumentException(fieldName + " must be a valid URL");
        }

        try {
            URI uri = new URI(url.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();

            if (scheme == null || host == null || host.isBlank()) {
                throw new IllegalArgumentException(fieldName + " must be a valid URL");
            }

            String normalizedScheme = scheme.toLowerCase(Locale.ROOT);
            if (!normalizedScheme.equals("http") && !normalizedScheme.equals("https")) {
                throw new IllegalArgumentException(fieldName + " must use http or https");
            }

            return uri;
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException(fieldName + " must be a valid URL");
        }
    }

    private static boolean isHostWithinDomain(String hostname, String domain) {
        return hostname.equals(domain) || hostname.endsWith("." + domain);
    }
}
