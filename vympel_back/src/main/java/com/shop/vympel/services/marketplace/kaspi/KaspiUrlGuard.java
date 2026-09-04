package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.exceptions.ProductImportException;
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
        if (address == null
                || address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }
        byte[] bytes = address.getAddress();
        if (bytes.length == 4) {
            int first = Byte.toUnsignedInt(bytes[0]);
            int second = Byte.toUnsignedInt(bytes[1]);
            int third = Byte.toUnsignedInt(bytes[2]);
            return first == 0
                    || first == 127
                    || first >= 224
                    || (first == 100 && second >= 64 && second <= 127)
                    || (first == 192 && second == 0 && (third == 0 || third == 2))
                    || (first == 192 && second == 88 && third == 99)
                    || (first == 198 && (second == 18 || second == 19))
                    || (first == 198 && second == 51 && third == 100)
                    || (first == 203 && second == 0 && third == 113);
        }
        if (bytes.length == 16) {
            if ((bytes[0] & 0xfe) == 0xfc) {
                return true;
            }
            boolean mappedIpv4 = true;
            for (int index = 0; index < 10; index++) {
                mappedIpv4 &= bytes[index] == 0;
            }
            mappedIpv4 &= bytes[10] == (byte) 0xff && bytes[11] == (byte) 0xff;
            if (mappedIpv4) {
                byte[] ipv4 = new byte[]{bytes[12], bytes[13], bytes[14], bytes[15]};
                try {
                    return isBlocked(InetAddress.getByAddress(ipv4));
                } catch (UnknownHostException impossible) {
                    return true;
                }
            }
            int first = Byte.toUnsignedInt(bytes[0]);
            int second = Byte.toUnsignedInt(bytes[1]);
            int third = Byte.toUnsignedInt(bytes[2]);
            int fourth = Byte.toUnsignedInt(bytes[3]);
            return (first == 0x20 && second == 0x01
                    && (third == 0x0d && fourth == 0xb8
                    || third == 0x00 && (fourth == 0x00 || fourth == 0x02 || fourth == 0x10)))
                    || (first == 0x20 && second == 0x02)
                    || (first == 0x00 && second == 0x64 && third == 0xff && fourth == 0x9b);
        }
        return false;
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
