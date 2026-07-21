package com.shop.vympel.security.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;

@Component
public class ClientAddressResolver {
    private static final int MAX_FORWARDED_LENGTH = 1024;
    private static final int MAX_FORWARDED_HOPS = 10;

    private final List<Cidr> trustedProxies;

    public ClientAddressResolver(RateLimitProperties properties) {
        this.trustedProxies = properties.getTrustedProxies().stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(Cidr::parse)
                .toList();
    }

    public String resolve(HttpServletRequest request) {
        InetAddress direct = parseAddress(request.getRemoteAddr());
        if (direct == null) {
            return "unknown";
        }
        if (!isTrusted(direct)) {
            return direct.getHostAddress();
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return direct.getHostAddress();
        }
        if (forwardedFor.length() > MAX_FORWARDED_LENGTH) {
            return direct.getHostAddress();
        }

        String[] rawHops = forwardedFor.split(",", -1);
        if (rawHops.length == 0 || rawHops.length > MAX_FORWARDED_HOPS) {
            return direct.getHostAddress();
        }

        List<InetAddress> hops = new ArrayList<>(rawHops.length);
        for (String rawHop : rawHops) {
            InetAddress hop = parseAddress(rawHop);
            if (hop == null) {
                return direct.getHostAddress();
            }
            hops.add(hop);
        }

        for (int index = hops.size() - 1; index >= 0; index--) {
            InetAddress hop = hops.get(index);
            if (!isTrusted(hop)) {
                return hop.getHostAddress();
            }
        }
        return hops.get(0).getHostAddress();
    }

    private boolean isTrusted(InetAddress address) {
        return trustedProxies.stream().anyMatch(cidr -> cidr.contains(address));
    }

    private InetAddress parseAddress(String value) {
        if (value == null) {
            return null;
        }
        String candidate = value.trim();
        if (candidate.startsWith("[") && candidate.endsWith("]")) {
            candidate = candidate.substring(1, candidate.length() - 1);
        }
        if (candidate.isBlank() || candidate.length() > 64 || !candidate.matches("[0-9A-Fa-f:.]+")) {
            return null;
        }
        try {
            return InetAddress.getByName(candidate);
        } catch (UnknownHostException ex) {
            return null;
        }
    }

    private record Cidr(byte[] network, int prefixLength) {
        static Cidr parse(String value) {
            String[] parts = value.split("/", -1);
            try {
                String addressValue = parts[0].trim();
                if (!addressValue.matches("[0-9A-Fa-f:.]+")) {
                    throw new IllegalArgumentException("Trusted proxy CIDRs must use numeric network addresses");
                }
                InetAddress address = InetAddress.getByName(addressValue);
                int bits = address.getAddress().length * 8;
                int prefix = parts.length == 1 ? bits : Integer.parseInt(parts[1]);
                if (prefix < 0 || prefix > bits) {
                    throw new IllegalArgumentException("Invalid trusted proxy CIDR");
                }
                return new Cidr(address.getAddress(), prefix);
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid trusted proxy CIDR configuration", ex);
            }
        }

        boolean contains(InetAddress address) {
            byte[] candidate = address.getAddress();
            if (candidate.length != network.length) {
                return false;
            }
            int fullBytes = prefixLength / 8;
            int remainingBits = prefixLength % 8;
            for (int index = 0; index < fullBytes; index++) {
                if (candidate[index] != network[index]) {
                    return false;
                }
            }
            if (remainingBits == 0) {
                return true;
            }
            int mask = 0xFF << (8 - remainingBits);
            return (candidate[fullBytes] & mask) == (network[fullBytes] & mask);
        }
    }
}
