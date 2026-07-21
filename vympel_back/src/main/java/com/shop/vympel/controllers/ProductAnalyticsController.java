package com.shop.vympel.controllers;

import com.shop.vympel.dtos.analytics.ProductAnalyticsTrackRequest;
import com.shop.vympel.dtos.analytics.ProductAnalyticsTrackResponse;
import com.shop.vympel.dtos.analytics.ProductPopularityAnalyticsResponse;
import com.shop.vympel.dtos.analytics.ProductPopularityRowResponse;
import com.shop.vympel.dtos.analytics.ProductPromotionUpdateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.product.ProductAnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProductAnalyticsController {
    private final ProductAnalyticsService productAnalyticsService;
    private final CrmActivityService crmActivityService;

    @PostMapping("/api/public/analytics/products/events")
    public ProductAnalyticsTrackResponse trackProductEvent(
            @RequestBody @Valid ProductAnalyticsTrackRequest req,
            HttpServletRequest request
    ) {
        return productAnalyticsService.track(req, request);
    }

    @GetMapping("/api/crm/analytics/products/popularity")
    public ProductPopularityAnalyticsResponse getProductPopularity(
            @RequestParam(defaultValue = "7d") String period,
            @RequestParam(defaultValue = "ru") String lang
    ) {
        return productAnalyticsService.getPopularity(period, Language.from(lang));
    }

    @PatchMapping("/api/crm/analytics/products/{id}/promotion")
    public ProductPopularityRowResponse updatePromotion(
            @PathVariable Long id,
            @RequestBody @Valid ProductPromotionUpdateRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductPopularityRowResponse product = productAnalyticsService.updatePromotion(id, req.promotionMode(), Language.from(lang));

        crmActivityService.log(
                "PRODUCT_PROMOTION_CHANGED",
                "PRODUCT",
                id,
                metadata("promotionMode", product.promotionMode(), "promotionScore", product.promotionScore()),
                request
        );

        return product;
    }

    private Map<String, Object> metadata(Object... values) {
        Map<String, Object> metadata = new HashMap<>();
        for (int index = 0; index + 1 < values.length; index += 2) {
            metadata.put(String.valueOf(values[index]), values[index + 1]);
        }
        return metadata;
    }
}
