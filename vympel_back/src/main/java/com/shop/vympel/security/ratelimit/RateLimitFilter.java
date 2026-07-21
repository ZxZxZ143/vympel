package com.shop.vympel.security.ratelimit;

import com.shop.vympel.security.GlobalErrorHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {
    private static final Pattern REVIEW_CREATE = Pattern.compile("^/api/public/product/(\\d+)/reviews$");
    private static final Pattern RECOMMENDATIONS = Pattern.compile("^/api/public/product/[^/]+/\\d+/recommendations$");

    private final RateLimitProperties properties;
    private final RateLimitService rateLimitService;
    private final ClientAddressResolver clientAddressResolver;

    public RateLimitFilter(
            RateLimitProperties properties,
            RateLimitService rateLimitService,
            ClientAddressResolver clientAddressResolver
    ) {
        this.properties = properties;
        this.rateLimitService = rateLimitService;
        this.clientAddressResolver = clientAddressResolver;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !properties.isEnabled() || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        PolicyMatch match = match(request);
        if (match == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String source = clientAddressResolver.resolve(request);
        try {
            if (match.publicWrite()) {
                rateLimitService.enforce("global-public-write", "global", "all-public-writes");
            }
            if ("public-review".equals(match.policy())) {
                rateLimitService.enforce("public-review-source", "source", source);
            }
            rateLimitService.enforce(match.policy(), match.identityCategory(), source + match.identitySuffix());
            filterChain.doFilter(request, response);
        } catch (RateLimitExceededException ex) {
            GlobalErrorHandler.writeRateLimitError(response, request, ex.getRetryAfterSeconds());
        } catch (RateLimitStoreUnavailableException ex) {
            GlobalErrorHandler.writeServiceUnavailableError(response, request);
        }
    }

    private PolicyMatch match(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("POST".equals(method) && "/api/crm/auth/login".equals(path)) {
            return new PolicyMatch("crm-login-source", "source", "", true);
        }
        if ("POST".equals(method) && "/api/auth/login/email".equals(path)) {
            return new PolicyMatch("customer-login-source", "source", "", true);
        }
        if ("POST".equals(method) && "/api/auth/register/email".equals(path)) {
            return new PolicyMatch("registration-source", "source", "", true);
        }
        if ("POST".equals(method) && "/api/crm/auth/refresh".equals(path)) {
            return new PolicyMatch("refresh-source", "source", "", true);
        }
        if ("POST".equals(method) && "/api/crm/auth/logout".equals(path)) {
            return new PolicyMatch("logout-source", "source", "", false);
        }
        Matcher review = REVIEW_CREATE.matcher(path);
        if ("POST".equals(method) && review.matches()) {
            return new PolicyMatch("public-review", "source-product", "|" + review.group(1), true);
        }
        if ("POST".equals(method) && "/api/public/requests".equals(path)) {
            return new PolicyMatch("public-request", "source", "", true);
        }
        if ("POST".equals(method) && "/api/public/analytics/products/events".equals(path)) {
            return new PolicyMatch("analytics-source", "source", "", true);
        }
        if ("GET".equals(method) && path.startsWith("/api/public/product/search/quick/")) {
            return new PolicyMatch("quick-search", "source", "", false);
        }
        if ("POST".equals(method) && path.startsWith("/api/public/product/batch-summary/")) {
            return new PolicyMatch("public-catalog-read", "source", "", false);
        }
        if ("GET".equals(method) && isCatalogRead(path)) {
            return new PolicyMatch("public-catalog-read", "source", "", false);
        }
        return null;
    }

    private boolean isCatalogRead(String path) {
        return path.startsWith("/api/public/product/catalog/")
                || path.startsWith("/api/public/product/by-code/")
                || path.startsWith("/api/public/product/by-id/")
                || path.startsWith("/api/public/product/filters/")
                || RECOMMENDATIONS.matcher(path).matches();
    }

    private record PolicyMatch(
            String policy,
            String identityCategory,
            String identitySuffix,
            boolean publicWrite
    ) {
    }
}
