package com.shop.vympel.dtos.crm;

import com.shop.vympel.dtos.product.ProductResponse;

import java.util.List;

public record CrmDashboardResponse(
        long totalProducts,
        long activeProducts,
        long inStockProducts,
        long outOfStockProducts,
        long missingKaspiLinks,
        long missingWildberriesLinks,
        long pendingReviews,
        List<ProductResponse> recentlyUpdatedProducts,
        List<CrmActivityResponse> recentActivities
) {
}
