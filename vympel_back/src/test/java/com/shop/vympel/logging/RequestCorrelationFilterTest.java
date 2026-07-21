package com.shop.vympel.logging;

import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RequestCorrelationFilterTest {
    private final RequestCorrelationFilter filter = new RequestCorrelationFilter();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void reusesSafeIncomingRequestIdAndReturnsIt() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/ping");
        request.addHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, "client-request-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (servletRequest, servletResponse) -> {
            assertEquals("client-request-123", MDC.get("requestId"));
            assertEquals("GET", MDC.get("httpMethod"));
            assertEquals("/api/public/ping", MDC.get("requestPath"));
            ((HttpServletResponse) servletResponse).setStatus(204);
        });

        assertEquals(
                "client-request-123",
                response.getHeader(RequestCorrelationFilter.REQUEST_ID_HEADER)
        );
        assertEquals(
                "client-request-123",
                request.getAttribute(RequestCorrelationFilter.REQUEST_ID_ATTRIBUTE)
        );
        assertNull(MDC.get("requestId"));
    }

    @Test
    void replacesUnsafeIncomingRequestId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/ping");
        request.addHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, "bad\r\ninjected");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (servletRequest, servletResponse) -> {
        });

        String generated = response.getHeader(RequestCorrelationFilter.REQUEST_ID_HEADER);
        UUID.fromString(generated);
    }
}
