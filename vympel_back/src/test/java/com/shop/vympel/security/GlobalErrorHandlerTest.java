package com.shop.vympel.security;

import com.shop.vympel.dtos.ApiErrorResponse;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.exceptions.InvalidRefreshTokenException;
import com.shop.vympel.exceptions.InvalidSortException;
import com.shop.vympel.logging.RequestCorrelationFilter;
import com.shop.vympel.security.ratelimit.RateLimitExceededException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.sql.SQLException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalErrorHandlerTest {
    private final GlobalErrorHandler handler = new GlobalErrorHandler();

    @Test
    void internalErrorsReturnGenericMessageAndRequestId() {
        MockHttpServletRequest request = request("request-internal-1");

        ResponseEntity<ApiErrorResponse> response = handler.handleInternal(
                new RuntimeException("password=must-not-leak"),
                request
        );

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Unexpected server error.", response.getBody().getMessage());
        assertEquals("request-internal-1", response.getBody().getRequestId());
        assertFalse(response.getBody().getMessage().contains("must-not-leak"));
    }

    @Test
    void sensitiveBadRequestMessagesAreNotReturned() {
        MockHttpServletRequest request = request("request-bad-1");

        ResponseEntity<ApiErrorResponse> response = handler.handleBadRequest(
                new IllegalArgumentException("password=must-not-leak"),
                request
        );

        assertNotNull(response.getBody());
        assertEquals("Invalid request.", response.getBody().getMessage());
        assertEquals("request-bad-1", response.getBody().getRequestId());
    }

    @Test
    void statusClassesRemainSemanticallyDistinctAndCorrelated() {
        ResponseEntity<ApiErrorResponse> malformed = handler.handleMalformedRequest(
                mock(HttpMessageNotReadableException.class),
                request("request-400")
        );
        ResponseEntity<ApiErrorResponse> unauthenticated = handler.handleBadCredentials(
                new BadCredentialsException("bad token"),
                request("request-401")
        );
        ResponseEntity<ApiErrorResponse> forbidden = handler.handleAccessDenied(
                new AccessDeniedException("denied"),
                request("request-403")
        );
        ResponseEntity<ApiErrorResponse> missing = handler.handleNotFound(
                new ResourceNotFoundException("Product 999 was not found"),
                request("request-404")
        );
        ResponseEntity<ApiErrorResponse> persistenceFailure = handler.handlePersistenceFailure(
                new DataAccessResourceFailureException("select * from secrets"),
                request("request-500")
        );

        assertStatusAndRequestId(malformed, HttpStatus.BAD_REQUEST, "request-400");
        assertStatusAndRequestId(unauthenticated, HttpStatus.UNAUTHORIZED, "request-401");
        assertStatusAndRequestId(forbidden, HttpStatus.FORBIDDEN, "request-403");
        assertStatusAndRequestId(missing, HttpStatus.NOT_FOUND, "request-404");
        assertStatusAndRequestId(persistenceFailure, HttpStatus.INTERNAL_SERVER_ERROR, "request-500");

        assertEquals("Resource not found.", missing.getBody().getMessage());
        assertEquals("RESOURCE_NOT_FOUND", missing.getBody().getCode());
        assertEquals("Unexpected server error.", persistenceFailure.getBody().getMessage());
        assertFalse(missing.getBody().toString().toLowerCase().contains("product 999"));
        assertFalse(persistenceFailure.getBody().toString().toLowerCase().contains("select"));
        assertFalse(persistenceFailure.getBody().toString().toLowerCase().contains("stack"));
    }

    @Test
    void invalidRefreshSessionReturnsSafeUnauthorizedContract() {
        ResponseEntity<ApiErrorResponse> response = handler.handleInvalidRefreshToken(
                new InvalidRefreshTokenException(),
                request("request-refresh-401")
        );

        assertStatusAndRequestId(response, HttpStatus.UNAUTHORIZED, "request-refresh-401");
        assertEquals("INVALID_SESSION", response.getBody().getCode());
        assertEquals("Invalid or expired session.", response.getBody().getMessage());
    }

    @Test
    void businessRuleViolationsReturnStableConflictCodes() {
        ResponseEntity<ApiErrorResponse> response = handler.handleBusinessRuleViolation(
                new BusinessRuleViolationException(
                        "PRODUCT_MAIN_IMAGE_REQUIRED",
                        "A main image is required before a product can be activated."
                ),
                request("request-conflict")
        );

        assertStatusAndRequestId(response, HttpStatus.CONFLICT, "request-conflict");
        assertEquals("PRODUCT_MAIN_IMAGE_REQUIRED", response.getBody().getCode());
        assertEquals("A main image is required before a product can be activated.", response.getBody().getMessage());
    }

    @Test
    void unsupportedSortReturnsStableBadRequestCode() {
        ResponseEntity<ApiErrorResponse> response = handler.handleInvalidSort(
                new InvalidSortException(),
                request("request-sort")
        );

        assertStatusAndRequestId(response, HttpStatus.BAD_REQUEST, "request-sort");
        assertEquals("INVALID_SORT", response.getBody().getCode());
        assertEquals("Unsupported sort value.", response.getBody().getMessage());
    }

    @Test
    void namedDatabaseConstraintsReturnStableSafeCodes() {
        var hibernateException = new org.hibernate.exception.ConstraintViolationException(
                "raw SQL must not leak",
                new SQLException("raw database detail"),
                "update cms_block set sort_order = 10",
                "uk_cms_block_page_sort_order"
        );
        ResponseEntity<ApiErrorResponse> response = handler.handleDataIntegrityViolation(
                new DataIntegrityViolationException("raw persistence detail", hibernateException),
                request("request-db-conflict")
        );

        assertStatusAndRequestId(response, HttpStatus.CONFLICT, "request-db-conflict");
        assertEquals("CMS_BLOCK_ORDER_CONFLICT", response.getBody().getCode());
        assertEquals("CMS block order conflicts with another block.", response.getBody().getMessage());
        assertFalse(response.getBody().toString().contains("uk_cms_block_page_sort_order"));
        assertFalse(response.getBody().toString().toLowerCase().contains("update cms_block"));
    }

    @Test
    void invalidRequestPayloadReturnsSafeBadRequestWithFieldDetails() {
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(exception.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("request", "email", "must be valid")
        ));

        ResponseEntity<ApiErrorResponse> response = handler.handleValidation(
                exception,
                request("request-validation")
        );

        assertStatusAndRequestId(response, HttpStatus.BAD_REQUEST, "request-validation");
        assertEquals("VALIDATION_ERROR", response.getBody().getCode());
        assertEquals("must be valid", response.getBody().getDetails().get("email"));
        assertFalse(response.getBody().toString().toLowerCase().contains("stack"));
    }

    @Test
    void securityErrorsContainCorrelationIdWithoutStackTrace() throws Exception {
        MockHttpServletRequest request = request("request-security-1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        GlobalErrorHandler.writeSecurityError(
                response,
                request,
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                "Authentication required."
        );

        assertEquals("request-security-1", response.getHeader(RequestCorrelationFilter.REQUEST_ID_HEADER));
        assertFalse(response.getContentAsString().contains("stack"));
        assertFalse(response.getContentAsString().contains("exception"));
        assertTrue(response.getContentAsString().contains("\"requestId\":\"request-security-1\""));
    }

    @Test
    void rateLimitResponseHasRetryAfterAndRequestIdWithoutInternalKey() throws Exception {
        MockHttpServletRequest request = request("request-429");
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        ResponseEntity<ApiErrorResponse> response = handler.handleRateLimitExceeded(
                new RateLimitExceededException("private-policy-key", 37),
                request
        );
        GlobalErrorHandler.writeRateLimitError(servletResponse, request, 37);

        assertStatusAndRequestId(response, HttpStatus.TOO_MANY_REQUESTS, "request-429");
        assertEquals("37", response.getHeaders().getFirst("Retry-After"));
        assertEquals(37L, response.getBody().getRetryAfterSeconds());
        assertEquals("37", servletResponse.getHeader("Retry-After"));
        assertTrue(servletResponse.getContentAsString().contains("\"requestId\":\"request-429\""));
        assertFalse(servletResponse.getContentAsString().contains("private-policy-key"));
    }

    private MockHttpServletRequest request(String requestId) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/crm/products");
        request.setAttribute(RequestCorrelationFilter.REQUEST_ID_ATTRIBUTE, requestId);
        return request;
    }

    private void assertStatusAndRequestId(
            ResponseEntity<ApiErrorResponse> response,
            HttpStatus expectedStatus,
            String expectedRequestId
    ) {
        assertEquals(expectedStatus, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedRequestId, response.getBody().getRequestId());
    }
}
