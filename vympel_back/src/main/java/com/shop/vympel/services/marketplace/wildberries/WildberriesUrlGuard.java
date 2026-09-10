package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.exceptions.ProductImportException;
import com.shop.vympel.services.marketplace.MarketplaceAddressPolicy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.IDN;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WildberriesUrlGuard {
    private static final int MAX_URL_LENGTH = 2048;
    private static final Set<String> PRODUCT_HOSTS = Set.of(
            "wildberries.ru", "www.wildberries.ru", "global.wildberries.ru"
    );
    private static final Pattern PRODUCT_PATH = Pattern.compile("^/catalog/([1-9]\\d*)/detail\\.aspx/?$");
    private static final Pattern BASKET_HOST = Pattern.compile("^basket-\\d{2}\\.wbbasket\\.ru$");
    private final HostResolver hostResolver;

    public WildberriesUrlGuard() {
        this(InetAddress::getAllByName);
    }

    WildberriesUrlGuard(HostResolver hostResolver) {
        this.hostResolver = hostResolver;
    }

    public ValidatedProduct validateProductUrl(String rawUrl) {
        URI parsed = parse(rawUrl, "WILDBERRIES_URL_INVALID", "Wildberries URL is invalid.");
        String host = normalizedHost(parsed);
        if (!PRODUCT_HOSTS.contains(host)) {
            throw invalid("WILDBERRIES_HOST_UNSUPPORTED", "Only Wildberries product URLs are supported.");
        }
        Matcher matcher = PRODUCT_PATH.matcher(parsed.getPath() == null ? "" : parsed.getPath());
        if (!matcher.matches()) {
            throw invalid("WILDBERRIES_URL_UNSUPPORTED", "The URL must point to a Wildberries product page.");
        }
        final long productId;
        try {
            productId = Long.parseLong(matcher.group(1));
        } catch (NumberFormatException ex) {
            throw invalid("WILDBERRIES_URL_INVALID", "Wildberries product identifier is invalid.");
        }
        URI canonical = URI.create("https://global.wildberries.ru/catalog/" + productId + "/detail.aspx");
        validateAddresses(host);
        return new ValidatedProduct(canonical, productId);
    }

    public URI validateCatalogApi(URI uri, long expectedProductId, String expectedDestination) {
        validateHttps(uri);
        if (!"card.wb.ru".equals(normalizedHost(uri))
                || !"/cards/v4/detail".equals(uri.getPath())) {
            throw blockedRedirect();
        }
        String query = uri.getRawQuery();
        String expected = "appType=1&curr=kzt&dest=" + expectedDestination + "&spp=30&nm=" + expectedProductId;
        if (!expected.equals(query)) throw blockedRedirect();
        validateAddresses(uri.getHost());
        return uri;
    }

    public URI validateDetailsUri(URI uri, long expectedProductId) {
        validateHttps(uri);
        String host = normalizedHost(uri);
        if (!("alm-basket-cdn-04.geobasket.net".equals(host) || BASKET_HOST.matcher(host).matches())) {
            throw blockedRedirect();
        }
        String expectedPath = detailsPath(expectedProductId);
        if (!expectedPath.equals(uri.getPath()) || uri.getRawQuery() != null) throw blockedRedirect();
        validateAddresses(host);
        return uri;
    }

    public URI resolveDetailsRedirect(URI current, String location, long expectedProductId) {
        if (location == null || location.isBlank()) throw blockedRedirect();
        try {
            return validateDetailsUri(current.resolve(location.trim()), expectedProductId);
        } catch (IllegalArgumentException | ProductImportException ex) {
            throw new ProductImportException(
                    "WILDBERRIES_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                    "Wildberries redirected to an unsupported destination.", ex
            );
        }
    }

    public static String detailsPath(long productId) {
        return "/vol" + (productId / 100_000) + "/part" + (productId / 1_000)
                + "/" + productId + "/info/ru/card.json";
    }

    private URI parse(String rawUrl, String code, String message) {
        if (rawUrl == null || rawUrl.isBlank() || rawUrl.trim().length() > MAX_URL_LENGTH) {
            throw invalid(code, message);
        }
        try {
            URI parsed = new URI(rawUrl.trim());
            validateHttps(parsed);
            return parsed;
        } catch (URISyntaxException ex) {
            throw invalid(code, message);
        }
    }

    private void validateHttps(URI uri) {
        if (!"https".equalsIgnoreCase(uri.getScheme())
                || uri.getRawUserInfo() != null
                || uri.getHost() == null
                || uri.getHost().isBlank()
                || (uri.getPort() != -1 && uri.getPort() != 443)
                || uri.getRawFragment() != null) {
            throw invalid("WILDBERRIES_URL_INVALID", "Wildberries URL must be a standard HTTPS URL.");
        }
    }

    private String normalizedHost(URI uri) {
        try {
            return IDN.toASCII(uri.getHost()).toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException ex) {
            throw invalid("WILDBERRIES_URL_INVALID", "Wildberries URL is invalid.");
        }
    }

    private void validateAddresses(String host) {
        final InetAddress[] addresses;
        try {
            addresses = hostResolver.resolve(host);
        } catch (UnknownHostException ex) {
            throw new ProductImportException(
                    "WILDBERRIES_FETCH_FAILED", HttpStatus.BAD_GATEWAY,
                    "Wildberries could not be reached.", ex
            );
        }
        if (addresses == null || addresses.length == 0) {
            throw new ProductImportException(
                    "WILDBERRIES_FETCH_FAILED", HttpStatus.BAD_GATEWAY,
                    "Wildberries could not be reached."
            );
        }
        for (InetAddress address : addresses) {
            if (MarketplaceAddressPolicy.isBlocked(address)) {
                throw invalid("WILDBERRIES_ADDRESS_BLOCKED", "The Wildberries destination is not allowed.");
            }
        }
    }

    private ProductImportException blockedRedirect() {
        return new ProductImportException(
                "WILDBERRIES_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                "Wildberries redirected to an unsupported destination."
        );
    }

    private ProductImportException invalid(String code, String message) {
        return new ProductImportException(code, HttpStatus.BAD_REQUEST, message);
    }

    @FunctionalInterface
    interface HostResolver {
        InetAddress[] resolve(String host) throws UnknownHostException;
    }

    public record ValidatedProduct(URI canonicalUrl, long productId) {
    }
}
