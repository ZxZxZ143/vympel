package com.shop.vympel.dtos.review;

import java.time.Instant;

public record CrmProductReviewResponse(
        Long id,
        Long productId,
        String productName,
        String productModel,
        String productSku,
        Integer rating,
        String text,
        String authorType,
        String authorName,
        Instant createdAt,
        String status,
        Instant moderatedAt,
        String moderatedBy
) {
}
