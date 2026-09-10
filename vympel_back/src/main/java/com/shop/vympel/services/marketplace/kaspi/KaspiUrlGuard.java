package com.shop.vympel.services.marketplace.kaspi;

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

@Component
public class KaspiUrlGuard {
    private static final int MAX_URL_LENGTH = 2048;
    private static final Set<String> ALLOWED_HOSTS = Set.of("kaspi.kz", "www.kaspi.kz");
    private final HostResolver hostResolver;

    public KaspiUrlGuard() {
        this(InetAddress::getAllByName);
    }

    KaspiUrlGuard(HostResolver hostResolver) {
        this.hostResolver = hostResolver;
    }

    public ValidatedTarget validate(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank() || rawUrl.trim().length() > MAX_URL_LENGTH) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL is required.");
        }

        final URI parsed;
        try {
            parsed = new URI(rawUrl.trim());
        } catch (URISyntaxException ex) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL is invalid.");
        }

        if (!"https".equalsIgnoreCase(parsed.getScheme())) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL must use HTTPS.");
        }
        if (parsed.getRawUserInfo() != null || parsed.getHost() == null || parsed.getHost().isBlank()) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL is invalid.");
        }
        if (parsed.getPort() != -1 && parsed.getPort() != 443) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL must use the standard HTTPS port.");
        }

        String host;
        try {
            host = IDN.toASCII(parsed.getHost()).toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException ex) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL is invalid.");
        }
        if (!ALLOWED_HOSTS.contains(host)) {
            throw invalid("KASPI_HOST_UNSUPPORTED", "Only Kaspi product URLs are supported.");
        }
        String path = parsed.getPath();
        if (path == null || !path.startsWith("/shop/p/") || path.length() <= "/shop/p/".length()) {
            throw invalid("KASPI_URL_UNSUPPORTED", "The URL must point to a Kaspi product page.");
        }

        final URI normalized;
        try {
            normalized = new URI("https", null, host, -1, parsed.getRawPath(), parsed.getRawQuery(), null);
        } catch (URISyntaxException ex) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL is invalid.");
        }
        if (normalized.toString().length() > MAX_URL_LENGTH) {
            throw invalid("KASPI_URL_INVALID", "Kaspi URL is too long.");
        }

        InetAddress[] addresses;
        try {
            addresses = hostResolver.resolve(host);
        } catch (UnknownHostException ex) {
            throw new ProductImportException(
                    "KASPI_FETCH_FAILED", HttpStatus.BAD_GATEWAY, "Kaspi could not be reached.", ex
            );
        }
        if (addresses == null || addresses.length == 0) {
            throw new ProductImportException(
                    "KASPI_FETCH_FAILED", HttpStatus.BAD_GATEWAY, "Kaspi could not be reached."
            );
        }
        for (InetAddress address : addresses) {
            if (isBlocked(address)) {
                throw invalid("KASPI_ADDRESS_BLOCKED", "The Kaspi destination is not allowed.");
            }
        }
        return new ValidatedTarget(normalized, addresses.clone());
    }

    static boolean isBlocked(InetAddress address) {
        return MarketplaceAddressPolicy.isBlocked(address);
    }

    private ProductImportException invalid(String code, String message) {
        return new ProductImportException(code, HttpStatus.BAD_REQUEST, message);
    }

    @FunctionalInterface
    interface HostResolver {
        InetAddress[] resolve(String host) throws UnknownHostException;
    }

    public record ValidatedTarget(URI uri, InetAddress[] addresses) {
        public ValidatedTarget {
            addresses = addresses.clone();
        }

        @Override
        public InetAddress[] addresses() {
            return addresses.clone();
        }
    }
}
