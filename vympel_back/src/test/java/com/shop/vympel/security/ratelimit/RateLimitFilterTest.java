package com.shop.vympel.security.ratelimit;

import com.shop.vympel.logging.RequestCorrelationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class RateLimitFilterTest {
    @Test
    void rejectedPublicWriteReturns429BeforePersistenceChain() throws Exception {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setEnabled(true);
        RateLimitService service = mock(RateLimitService.class);
        doThrow(new RateLimitExceededException("public-request", 45))
                .when(service).enforce(eq("public-request"), eq("source"), anyString());
        RateLimitFilter filter = new RateLimitFilter(
                properties,
                service,
                new ClientAddressResolver(properties)
        );
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/public/requests");
        request.setRemoteAddr("203.0.113.7");
        request.setAttribute(RequestCorrelationFilter.REQUEST_ID_ATTRIBUTE, "request-filter-429");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(429, response.getStatus());
        assertEquals("45", response.getHeader("Retry-After"));
        assertEquals("request-filter-429", response.getHeader("X-Request-Id"));
        assertTrue(response.getContentAsString().contains("RATE_LIMIT_EXCEEDED"));
        assertFalse(response.getContentAsString().contains("public-request"));
        assertNull(chain.getRequest());
        verify(service, never()).enforce("global-public-write", "global", "all-public-writes");
    }

    @Test
    void acceptedPublicWriteConsumesSourcePolicyBeforeGlobalCapacity() throws Exception {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setEnabled(true);
        RateLimitService service = mock(RateLimitService.class);
        RateLimitFilter filter = new RateLimitFilter(properties, service, new ClientAddressResolver(properties));

        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request("POST", "/api/public/analytics/products/events"),
                new MockHttpServletResponse(), chain);

        var order = inOrder(service);
        order.verify(service).enforce("analytics-source", "source", "203.0.113.7");
        order.verify(service).enforce("global-public-write", "global", "all-public-writes");
        assertTrue(chain.getRequest() != null);
    }

    @Test
    void authenticationAndRefreshNeverConsumePublicWriteCapacity() throws Exception {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setEnabled(true);
        RateLimitService service = mock(RateLimitService.class);
        RateLimitFilter filter = new RateLimitFilter(properties, service, new ClientAddressResolver(properties));

        for (String path : new String[]{
                "/api/crm/auth/login",
                "/api/auth/login/email",
                "/api/auth/register/email",
                "/api/crm/auth/refresh"
        }) {
            filter.doFilter(request("POST", path), new MockHttpServletResponse(), new MockFilterChain());
        }

        verify(service, never()).enforce("global-public-write", "global", "all-public-writes");
    }

    @Test
    void mapsAuthWritesAnalyticsReviewAndPublicReadsToSeparateRiskPolicies() throws Exception {
        RateLimitProperties properties = new RateLimitProperties();
        properties.setEnabled(true);
        RateLimitService service = mock(RateLimitService.class);
        RateLimitFilter filter = new RateLimitFilter(properties, service, new ClientAddressResolver(properties));

        filter.doFilter(request("POST", "/api/public/analytics/products/events"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("POST", "/api/public/product/42/reviews"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("GET", "/api/public/product/search/quick/ru"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("POST", "/api/crm/auth/login"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("POST", "/api/auth/login/email"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("POST", "/api/auth/register/email"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("POST", "/api/crm/auth/refresh"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("POST", "/api/crm/auth/logout"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("POST", "/api/crm/products/import/kaspi"),
                new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(request("GET", "/api/public/product/ru/42/recommendations"),
                new MockHttpServletResponse(), new MockFilterChain());

        verify(service).enforce("analytics-source", "source", "203.0.113.7");
        verify(service).enforce("public-review-source", "source", "203.0.113.7");
        verify(service).enforce("public-review", "source-product", "203.0.113.7|42");
        verify(service).enforce("quick-search", "source", "203.0.113.7");
        verify(service).enforce("crm-login-source", "source", "203.0.113.7");
        verify(service).enforce("customer-login-source", "source", "203.0.113.7");
        verify(service).enforce("registration-source", "source", "203.0.113.7");
        verify(service).enforce("refresh-source", "source", "203.0.113.7");
        verify(service).enforce("logout-source", "source", "203.0.113.7");
        verify(service).enforce("crm-product-import", "source", "203.0.113.7");
        verify(service).enforce("public-catalog-read", "source", "203.0.113.7");
    }

    private MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr("203.0.113.7");
        request.setAttribute(RequestCorrelationFilter.REQUEST_ID_ATTRIBUTE, "request-matrix");
        return request;
    }
}
