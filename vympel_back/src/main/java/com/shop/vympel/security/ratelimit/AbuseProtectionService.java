package com.shop.vympel.security.ratelimit;

import com.shop.vympel.dtos.analytics.ProductAnalyticsTrackRequest;
import com.shop.vympel.dtos.review.ProductReviewCreateRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class AbuseProtectionService {
    private final RateLimitService rateLimitService;
    private final ClientAddressResolver clientAddressResolver;

    public AbuseProtectionService(
            RateLimitService rateLimitService,
            ClientAddressResolver clientAddressResolver
    ) {
        this.rateLimitService = rateLimitService;
        this.clientAddressResolver = clientAddressResolver;
    }

    public void enforceRegistrationIdentity(String email) {
        rateLimitService.enforce("registration-identity", "account", normalizeEmail(email));
    }

    public void enforceReviewDuplicate(
            Long productId,
            ProductReviewCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        String text = request.text() == null ? "" : request.text().trim().toLowerCase(Locale.ROOT);
        rateLimitService.enforce(
                "public-review-duplicate",
                "source-product-content",
                clientAddressResolver.resolve(servletRequest) + "|" + productId + "|" + request.rating() + "|" + text
        );
    }

    public void enforceCustomerRequestContact(String email, String phone) {
        String contact = email != null ? "email:" + normalizeEmail(email) : "phone:" + digitsOnly(phone);
        rateLimitService.enforce(
                "public-request-contact",
                "contact",
                contact
        );
    }

    public boolean isDuplicateAnalytics(ProductAnalyticsTrackRequest request, HttpServletRequest servletRequest) {
        String session = normalizedSession(request.sessionId());
        String identity = clientAddressResolver.resolve(servletRequest)
                + "|" + request.eventType().trim().toUpperCase(Locale.ROOT)
                + "|" + request.productId()
                + "|" + session;
        return !rateLimitService.evaluate("analytics-dedup", "source-event-product", identity).allowed();
    }

    private String normalizeEmail(String value) {
        if (value == null) {
            return "missing";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.length() <= 254 ? normalized : normalized.substring(0, 254);
    }

    private String digitsOnly(String value) {
        if (value == null) {
            return "missing";
        }
        String digits = value.replaceAll("\\D", "");
        return digits.length() <= 20 ? digits : digits.substring(0, 20);
    }

    private String normalizedSession(String value) {
        if (value == null || !value.matches("[A-Za-z0-9._:-]{1,100}")) {
            return "no-session";
        }
        return value;
    }
}
