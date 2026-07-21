package com.shop.vympel.services.product;

import com.shop.vympel.db.entity.analytics.ProductAnalyticsEvent;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.analytics.ProductAnalyticsEventRepository;
import com.shop.vympel.db.repositories.analytics.ProductPopularityProjection;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.dtos.analytics.*;
import com.shop.vympel.enums.Language;
import com.shop.vympel.enums.ProductAnalyticsEventType;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.security.ratelimit.AbuseProtectionService;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductAnalyticsService {
    private static final int LIST_LIMIT = 10;

    private final ProductAnalyticsEventRepository analyticsEventRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final AbuseProtectionService abuseProtectionService;
    private final MeterRegistry meterRegistry;

    @Transactional
    public ProductAnalyticsTrackResponse track(ProductAnalyticsTrackRequest request, HttpServletRequest servletRequest) {
        ProductAnalyticsEventType eventType = parseEventType(request.eventType());
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (abuseProtectionService.isDuplicateAnalytics(request, servletRequest)) {
            meterRegistry.counter("analytics_deduplicated_total", "eventType", eventType.name()).increment();
            return new ProductAnalyticsTrackResponse(false);
        }

        ProductAnalyticsEvent event = new ProductAnalyticsEvent();
        event.setProduct(product);
        event.setEventType(eventType.name());

        analyticsEventRepository.save(event);

        return new ProductAnalyticsTrackResponse(true);
    }

    @Transactional(readOnly = true)
    public ProductPopularityAnalyticsResponse getPopularity(String period, Language language) {
        String normalizedPeriod = normalizePeriod(period);
        Instant since = sinceForPeriod(normalizedPeriod);
        List<ProductPopularityRowResponse> rows = aggregatePopularity(since, language)
                .stream()
                .map(this::toRow)
                .toList();

        long views = rows.stream().mapToLong(ProductPopularityRowResponse::views).sum();
        long favorites = rows.stream().mapToLong(ProductPopularityRowResponse::favorites).sum();
        long cartAdditions = rows.stream().mapToLong(ProductPopularityRowResponse::cartAdditions).sum();

        List<ProductPopularityRowResponse> lowDemand = rows.stream()
                .filter(this::isDemandSupportCandidate)
                .sorted(Comparator
                        .comparingDouble(ProductPopularityRowResponse::recommendedPromotionScore).reversed()
                        .thenComparing(ProductPopularityRowResponse::stockQuantity, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(LIST_LIMIT)
                .toList();

        return new ProductPopularityAnalyticsResponse(
                normalizedPeriod,
                Instant.now(),
                new ProductAnalyticsSummaryResponse(views, favorites, cartAdditions, rate(cartAdditions, views)),
                topBy(rows, Comparator.comparingLong(ProductPopularityRowResponse::views).reversed()),
                topBy(rows, Comparator.comparingLong(ProductPopularityRowResponse::favorites).reversed()),
                topBy(rows, Comparator.comparingLong(ProductPopularityRowResponse::cartAdditions).reversed()),
                lowDemand,
                topBy(rows, Comparator
                        .comparingDouble(this::interestScore).reversed()
                        .thenComparing(ProductPopularityRowResponse::views, Comparator.reverseOrder())),
                lowDemand.stream()
                        .filter(ProductPopularityRowResponse::promotionRecommended)
                        .limit(LIST_LIMIT)
                        .toList()
        );
    }

    @Transactional
    public ProductPopularityRowResponse updatePromotion(Long productId, String promotionMode, Language language) {
        productService.updatePromotion(productId, promotionMode, language);
        return aggregatePopularity(null, language)
                .stream()
                .filter(row -> productId.equals(row.getProductId()))
                .findFirst()
                .map(this::toRow)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private ProductPopularityRowResponse toRow(ProductPopularityProjection projection) {
        long views = valueOrZero(projection.getViews());
        long favorites = valueOrZero(projection.getFavorites());
        long cartAdditions = valueOrZero(projection.getCartAdditions());
        boolean recommended = isPromotionRecommended(projection, views, favorites, cartAdditions);
        double recommendedScore = recommended ? recommendationScore(projection, views, cartAdditions) : 0;

        return new ProductPopularityRowResponse(
                projection.getProductId(),
                projection.getSku(),
                projection.getName(),
                projection.getModel(),
                projection.getStockQuantity(),
                projection.getStatus(),
                projection.getPromotionMode(),
                projection.getPromotionScore() == null ? BigDecimal.ZERO : projection.getPromotionScore(),
                projection.getPromotedUntil(),
                views,
                favorites,
                cartAdditions,
                rate(cartAdditions, views),
                recommended,
                recommendedScore,
                recommendationReason(projection, views, favorites, cartAdditions)
        );
    }

    private List<ProductPopularityProjection> aggregatePopularity(Instant since, Language language) {
        if (since == null) {
            return analyticsEventRepository.aggregatePopularity(language.getValue());
        }

        return analyticsEventRepository.aggregatePopularitySince(since, language.getValue());
    }

    private List<ProductPopularityRowResponse> topBy(
            List<ProductPopularityRowResponse> rows,
            Comparator<ProductPopularityRowResponse> comparator
    ) {
        return rows.stream()
                .filter(row -> row.views() > 0 || row.favorites() > 0 || row.cartAdditions() > 0)
                .sorted(comparator)
                .limit(LIST_LIMIT)
                .toList();
    }

    private boolean isDemandSupportCandidate(ProductPopularityRowResponse row) {
        return "ACTIVE".equalsIgnoreCase(row.status())
                && row.stockQuantity() != null
                && row.stockQuantity() > 0
                && (row.views() <= 5 || row.cartAdditions() == 0);
    }

    private boolean isPromotionRecommended(
            ProductPopularityProjection projection,
            long views,
            long favorites,
            long cartAdditions
    ) {
        return "ACTIVE".equalsIgnoreCase(projection.getStatus())
                && projection.getStockQuantity() != null
                && projection.getStockQuantity() > 0
                && !"MANUAL".equalsIgnoreCase(projection.getPromotionMode())
                && (views <= 5 || cartAdditions == 0 || (favorites >= 2 && views < 20));
    }

    private String recommendationReason(
            ProductPopularityProjection projection,
            long views,
            long favorites,
            long cartAdditions
    ) {
        if (!isPromotionRecommended(projection, views, favorites, cartAdditions)) {
            return null;
        }

        if (views <= 5) {
            return "LOW_VIEWS_WITH_STOCK";
        }

        if (cartAdditions == 0) {
            return "LOW_CART_ADDITIONS";
        }

        if (favorites >= 2 && views < 20) {
            return "GOOD_INTEREST_LOW_EXPOSURE";
        }

        return "DEMAND_SUPPORT";
    }

    private double recommendationScore(ProductPopularityProjection projection, long views, long cartAdditions) {
        int stock = projection.getStockQuantity() == null ? 0 : projection.getStockQuantity();
        return stock * 1.5 + Math.max(0, 10 - views) * 10 + Math.max(0, 3 - cartAdditions) * 15;
    }

    private double interestScore(ProductPopularityRowResponse row) {
        return row.views() + row.favorites() * 3.0 + row.cartAdditions() * 5.0;
    }

    private ProductAnalyticsEventType parseEventType(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            throw new IllegalArgumentException("eventType is required");
        }

        try {
            return ProductAnalyticsEventType.valueOf(eventType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported eventType");
        }
    }

    private String normalizePeriod(String period) {
        if (period == null || period.isBlank()) {
            return "7d";
        }

        String value = period.trim().toLowerCase();
        return switch (value) {
            case "today", "7d", "30d", "all" -> value;
            default -> throw new IllegalArgumentException("Unsupported analytics period");
        };
    }

    private Instant sinceForPeriod(String period) {
        return switch (period) {
            case "today" -> Instant.now().truncatedTo(ChronoUnit.DAYS);
            case "7d" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "30d" -> Instant.now().minus(30, ChronoUnit.DAYS);
            case "all" -> Instant.now().minus(180, ChronoUnit.DAYS);
            default -> throw new IllegalArgumentException("Unsupported analytics period");
        };
    }

    private double rate(long numerator, long denominator) {
        if (denominator <= 0) {
            return 0;
        }

        return Math.round((numerator * 10000.0 / denominator)) / 100.0;
    }

    private long valueOrZero(Long value) {
        return value == null ? 0 : value;
    }

}
