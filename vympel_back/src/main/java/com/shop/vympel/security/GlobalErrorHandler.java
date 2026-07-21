package com.shop.vympel.security;

import com.shop.vympel.dtos.ApiErrorResponse;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.exceptions.InvalidRefreshTokenException;
import com.shop.vympel.exceptions.InvalidSortException;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.logging.RequestCorrelationFilter;
import com.shop.vympel.logging.SecurityAuditLogger;
import com.shop.vympel.logging.SensitiveDataMasker;
import com.shop.vympel.security.ratelimit.RateLimitExceededException;
import com.shop.vympel.security.ratelimit.RateLimitStoreUnavailableException;
import jakarta.persistence.PersistenceException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalErrorHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest req
    ) {
        Map<String, String> details = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            details.put(fe.getField(), fe.getDefaultMessage());
        }
        log.warn("Request validation failed fields={}", details.keySet());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("VALIDATION_ERROR")
                        .message("Invalid request data.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(details)
                        .build()
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest req
    ) {
        return validationResponse(ex, req);
    }

    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<ApiErrorResponse> handleTransactionValidation(
            TransactionSystemException ex,
            HttpServletRequest req
    ) {
        Throwable rootCause = ex.getRootCause();
        if (rootCause instanceof ConstraintViolationException constraintViolation) {
            return validationResponse(constraintViolation, req);
        }
        log.error("Database transaction failed", ex);
        return internalResponse(req);
    }

    @ExceptionHandler({DataAccessException.class, PersistenceException.class})
    public ResponseEntity<ApiErrorResponse> handlePersistenceFailure(
            Exception ex,
            HttpServletRequest req
    ) {
        ConstraintError constraintError = resolveConstraintError(ex);
        if (constraintError != null) {
            return constraintResponse(constraintError, req);
        }
        log.error("Database operation failed", ex);
        return internalResponse(req);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest req
    ) {
        ConstraintError constraintError = resolveConstraintError(ex);
        if (constraintError == null) {
            log.error("Unmapped database integrity violation", ex);
            return internalResponse(req);
        }
        return constraintResponse(constraintError, req);
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessRuleViolation(
            BusinessRuleViolationException ex,
            HttpServletRequest req
    ) {
        log.warn("Business rule rejected code={}", ex.getCode());
        return errorResponse(HttpStatus.CONFLICT, ex.getCode(), ex.getMessage(), req);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest req
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.UNAUTHORIZED.value())
                        .code("BAD_CREDENTIALS")
                        .message("Invalid credentials.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRefreshToken(
            InvalidRefreshTokenException ex,
            HttpServletRequest req
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.UNAUTHORIZED.value())
                        .code("INVALID_SESSION")
                        .message("Invalid or expired session.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            MultipartException.class
    })
    public ResponseEntity<ApiErrorResponse> handleMalformedRequest(
            Exception ex,
            HttpServletRequest req
    ) {
        log.warn("Malformed request rejected type={}", ex.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("BAD_REQUEST")
                        .message("Malformed request.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSize(
            MaxUploadSizeExceededException ex,
            HttpServletRequest req
    ) {
        log.warn("Oversized upload rejected");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("UPLOAD_TOO_LARGE")
                        .message("Uploaded file is too large.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest req
    ) {
        log.info("Requested resource was not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.NOT_FOUND.value())
                        .code("RESOURCE_NOT_FOUND")
                        .message("Resource not found.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    @ExceptionHandler(InvalidSortException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidSort(
            InvalidSortException ex,
            HttpServletRequest req
    ) {
        log.warn("Unsupported catalog sort rejected");
        return errorResponse(HttpStatus.BAD_REQUEST, "INVALID_SORT", ex.getMessage(), req);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
            IllegalArgumentException ex,
            HttpServletRequest req
    ) {
        String safeMessage = SensitiveDataMasker.safeClientMessage(ex.getMessage(), "Invalid request.");
        log.warn("Bad request rejected reason={}", safeMessage);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("BAD_REQUEST")
                        .message(safeMessage)
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    private ResponseEntity<ApiErrorResponse> constraintResponse(
            ConstraintError error,
            HttpServletRequest req
    ) {
        log.warn("Database constraint rejected code={}", error.code());
        return errorResponse(error.status(), error.code(), error.message(), req);
    }

    private ResponseEntity<ApiErrorResponse> errorResponse(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest req
    ) {
        return ResponseEntity.status(status).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(status.value())
                        .code(code)
                        .message(message)
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    private ConstraintError resolveConstraintError(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof org.hibernate.exception.ConstraintViolationException violation) {
                ConstraintError mapped = constraintError(violation.getConstraintName());
                if (mapped != null) {
                    return mapped;
                }
            }
            current = current.getCause();
        }
        return null;
    }

    private ConstraintError constraintError(String constraintName) {
        if (constraintName == null) {
            return null;
        }
        return switch (constraintName) {
            case "chk_product_price_nonnegative" -> new ConstraintError(
                    HttpStatus.BAD_REQUEST, "PRODUCT_PRICE_NEGATIVE", "Product price must be non-negative."
            );
            case "chk_product_stock_nonnegative" -> new ConstraintError(
                    HttpStatus.BAD_REQUEST, "PRODUCT_STOCK_NEGATIVE", "Product stock must be non-negative."
            );
            case "chk_media_position_nonnegative" -> new ConstraintError(
                    HttpStatus.BAD_REQUEST, "PRODUCT_MEDIA_POSITION_INVALID", "Product image position must be non-negative."
            );
            case "uk_media_product_type_position" -> new ConstraintError(
                    HttpStatus.CONFLICT, "PRODUCT_MEDIA_POSITION_CONFLICT", "Product image positions conflict."
            );
            case "chk_media_main_image_position", "ux_media_one_main_image_per_product" -> new ConstraintError(
                    HttpStatus.CONFLICT, "PRODUCT_MAIN_IMAGE_CONFLICT", "Product main image state conflicts."
            );
            case "chk_cms_block_sort_order_nonnegative" -> new ConstraintError(
                    HttpStatus.BAD_REQUEST, "CMS_BLOCK_ORDER_INVALID", "CMS block order must be non-negative."
            );
            case "uk_cms_block_page_sort_order" -> new ConstraintError(
                    HttpStatus.CONFLICT, "CMS_BLOCK_ORDER_CONFLICT", "CMS block order conflicts with another block."
            );
            default -> null;
        };
    }

    private record ConstraintError(HttpStatus status, String code, String message) {
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest req
    ) {
        SecurityAuditLogger.forbiddenAccess();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.FORBIDDEN.value())
                        .code("FORBIDDEN")
                        .message("Insufficient permissions.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleRateLimitExceeded(
            RateLimitExceededException ex,
            HttpServletRequest req
    ) {
        long retryAfter = ex.getRetryAfterSeconds();
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(retryAfter))
                .body(rateLimitBody(req, retryAfter));
    }

    @ExceptionHandler(RateLimitStoreUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleRateLimitStoreUnavailable(
            RateLimitStoreUnavailableException ex,
            HttpServletRequest req
    ) {
        log.error("Required abuse-protection store is unavailable");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.SERVICE_UNAVAILABLE.value())
                        .code("SERVICE_TEMPORARILY_UNAVAILABLE")
                        .message("Service temporarily unavailable. Please try again later.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleInternal(
            Exception ex,
            HttpServletRequest req
    ) {
        log.error("Unhandled API error", ex);

        return internalResponse(req);
    }

    private ResponseEntity<ApiErrorResponse> internalResponse(HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .code("INTERNAL_ERROR")
                        .message("Unexpected server error.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(null)
                        .build()
        );
    }

    public static AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            SecurityAuditLogger.unauthorizedAccess();
            writeSecurityError(response, request, HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED", "Authentication required.");
        };
    }

    public static AccessDeniedHandler accessDeniedHandlerAs401() {
        return (request, response, accessDeniedException) -> {
            SecurityAuditLogger.unauthorizedAccess();
            writeSecurityError(response, request, HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED", "Authentication required.");
        };
    }

    public static AccessDeniedHandler accessDeniedHandlerAs403() {
        return (request, response, accessDeniedException) -> {
            SecurityAuditLogger.forbiddenAccess();
            writeSecurityError(response, request, HttpStatus.FORBIDDEN,
                    "FORBIDDEN", "Insufficient permissions.");
        };
    }

    public static void writeSecurityError(
            HttpServletResponse response,
            HttpServletRequest request,
            HttpStatus status,
            String code,
            String message
    ) throws IOException {

        ApiErrorResponse body = ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .code(code)
                .message(message)
                .requestId(requestId(request))
                .path(request.getRequestURI())
                .details(null)
                .build();

        String json = toJson(body);

        response.setStatus(status.value());
        response.setHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, body.getRequestId());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(json);
    }

    public static void writeRateLimitError(
            HttpServletResponse response,
            HttpServletRequest request,
            long retryAfterSeconds
    ) throws IOException {
        ApiErrorResponse body = rateLimitBody(request, retryAfterSeconds);
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(body.getRetryAfterSeconds()));
        writeJson(response, body);
    }

    public static void writeServiceUnavailableError(
            HttpServletResponse response,
            HttpServletRequest request
    ) throws IOException {
        ApiErrorResponse body = ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.SERVICE_UNAVAILABLE.value())
                .code("SERVICE_TEMPORARILY_UNAVAILABLE")
                .message("Service temporarily unavailable. Please try again later.")
                .requestId(requestId(request))
                .path(request.getRequestURI())
                .details(null)
                .build();
        response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
        writeJson(response, body);
    }

    private static ApiErrorResponse rateLimitBody(HttpServletRequest request, long retryAfterSeconds) {
        return ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.TOO_MANY_REQUESTS.value())
                .code("RATE_LIMIT_EXCEEDED")
                .message("Too many requests. Please try again later.")
                .requestId(requestId(request))
                .path(request.getRequestURI())
                .retryAfterSeconds(Math.max(1, retryAfterSeconds))
                .details(null)
                .build();
    }

    private static void writeJson(HttpServletResponse response, ApiErrorResponse body) throws IOException {
        response.setHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, body.getRequestId());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(toJson(body));
    }

    private static String toJson(ApiErrorResponse e) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"timestamp\":\"").append(e.getTimestamp()).append("\",");
        sb.append("\"status\":").append(e.getStatus()).append(",");
        sb.append("\"code\":\"").append(escape(e.getCode())).append("\",");
        sb.append("\"message\":\"").append(escape(e.getMessage())).append("\",");
        sb.append("\"requestId\":\"").append(escape(e.getRequestId())).append("\",");
        sb.append("\"path\":\"").append(escape(e.getPath())).append("\"");
        if (e.getRetryAfterSeconds() != null) {
            sb.append(",\"retryAfterSeconds\":").append(e.getRetryAfterSeconds());
        }
        if (e.getDetails() != null && !e.getDetails().isEmpty()) {
            sb.append(",\"details\":{");
            boolean first = true;
            for (var entry : e.getDetails().entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("\"").append(escape(entry.getKey())).append("\":");
                sb.append("\"").append(escape(entry.getValue())).append("\"");
            }
            sb.append("}");
        }
        sb.append("}");
        return sb.toString();
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private ResponseEntity<ApiErrorResponse> validationResponse(
            ConstraintViolationException ex,
            HttpServletRequest req
    ) {
        Map<String, String> details = new HashMap<>();
        ex.getConstraintViolations().forEach(violation ->
                details.put(String.valueOf(violation.getPropertyPath()), violation.getMessage())
        );
        log.warn("Constraint validation failed fields={}", details.keySet());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("VALIDATION_ERROR")
                        .message("Invalid request data.")
                        .requestId(requestId(req))
                        .path(req.getRequestURI())
                        .details(details)
                        .build()
        );
    }

    private static String requestId(HttpServletRequest request) {
        return RequestCorrelationFilter.requestId(request);
    }
}
