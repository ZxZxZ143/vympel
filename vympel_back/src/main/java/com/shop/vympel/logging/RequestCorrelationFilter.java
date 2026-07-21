package com.shop.vympel.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {
    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String REQUEST_ID_ATTRIBUTE = RequestCorrelationFilter.class.getName() + ".requestId";
    public static final String USER_ID_ATTRIBUTE = RequestCorrelationFilter.class.getName() + ".userId";
    public static final String ROLES_ATTRIBUTE = RequestCorrelationFilter.class.getName() + ".roles";

    private static final Logger LOG = LoggerFactory.getLogger(RequestCorrelationFilter.class);
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._:-]{1,128}");
    private static final Set<String> MUTATION_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        Map<String, String> previousContext = MDC.getCopyOfContextMap();
        String requestId = resolveRequestId(request.getHeader(REQUEST_ID_HEADER));
        String method = request.getMethod();
        String path = SensitiveDataMasker.sanitizeForLog(request.getRequestURI());
        long startedAt = System.nanoTime();
        Throwable failure = null;

        request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        MDC.put("requestId", requestId);
        MDC.put("httpMethod", method);
        MDC.put("requestPath", path);

        try {
            filterChain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException ex) {
            failure = ex;
            throw ex;
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000L;
            int status = response.getStatus();
            int effectiveStatus = failure != null && status < 400 ? 500 : status;
            restoreUserContext(request);

            if (failure == null && isSuccessfulProbe(path, effectiveStatus)) {
                LOG.debug("health_probe_completed status={} durationMs={}", effectiveStatus, durationMs);
            } else if (failure == null) {
                LOG.info("request_completed status={} durationMs={}", effectiveStatus, durationMs);
            } else {
                LOG.error(
                        "request_failed status={} durationMs={} exceptionType={}",
                        effectiveStatus,
                        durationMs,
                        failure.getClass().getSimpleName(),
                        failure
                );
            }

            if (isFailedCrmMutation(method, path, effectiveStatus)) {
                CrmActionFileLogger.failure(method, path, effectiveStatus);
            }

            MDC.clear();
            if (previousContext != null) {
                MDC.setContextMap(previousContext);
            }
        }
    }

    public static String requestId(HttpServletRequest request) {
        Object attribute = request == null ? null : request.getAttribute(REQUEST_ID_ATTRIBUTE);
        if (attribute != null) {
            return String.valueOf(attribute);
        }
        String fromMdc = MDC.get("requestId");
        return fromMdc == null || fromMdc.isBlank() ? "unknown" : fromMdc;
    }

    private String resolveRequestId(String incoming) {
        if (incoming != null) {
            String candidate = incoming.trim();
            if (SAFE_REQUEST_ID.matcher(candidate).matches()) {
                return candidate;
            }
        }
        return UUID.randomUUID().toString();
    }

    private boolean isFailedCrmMutation(String method, String path, int status) {
        return status >= 400
                && MUTATION_METHODS.contains(method)
                && path != null
                && (path.startsWith("/api/crm/") || path.startsWith("/api/admin/"));
    }

    private boolean isSuccessfulProbe(String path, int status) {
        return status < 400
                && path != null
                && (path.equals("/actuator/health/liveness") || path.equals("/actuator/health/readiness"));
    }

    private void restoreUserContext(HttpServletRequest request) {
        Object userId = request.getAttribute(USER_ID_ATTRIBUTE);
        Object roles = request.getAttribute(ROLES_ATTRIBUTE);
        if (userId != null) {
            MDC.put("userId", String.valueOf(userId));
        }
        if (roles != null) {
            MDC.put("roles", String.valueOf(roles));
        }
    }
}
