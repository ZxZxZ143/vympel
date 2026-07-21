package com.shop.vympel.security.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClientAddressResolverTest {
    @Test
    void ignoresSpoofedForwardingHeadersFromUntrustedPeer() {
        ClientAddressResolver resolver = resolver(List.of("10.0.0.0/8"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.9");
        request.addHeader("X-Forwarded-For", "198.51.100.44");
        request.addHeader("X-Real-IP", "198.51.100.45");

        assertEquals("203.0.113.9", resolver.resolve(request));
    }

    @Test
    void resolvesRightmostUntrustedAddressThroughTrustedProxyChain() {
        ClientAddressResolver resolver = resolver(List.of("10.0.0.0/8"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.5");
        request.addHeader("X-Forwarded-For", "198.51.100.44, 10.1.2.3");

        assertEquals("198.51.100.44", resolver.resolve(request));
    }

    @Test
    void malformedForwardingChainFallsBackToDirectPeer() {
        ClientAddressResolver resolver = resolver(List.of("10.0.0.0/8"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.5");
        request.addHeader("X-Forwarded-For", "198.51.100.44, attacker.example");

        assertEquals("10.0.0.5", resolver.resolve(request));
    }

    private ClientAddressResolver resolver(List<String> trustedProxies) {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setTrustedProxies(trustedProxies);
        return new ClientAddressResolver(properties);
    }
}
