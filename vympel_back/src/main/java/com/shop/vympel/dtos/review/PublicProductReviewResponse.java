package com.shop.vympel.dtos.review;

import java.time.Instant;

public record PublicProductReviewResponse(
        Long id,
        Integer rating,
        String text,
        String authorType,
        String authorName,
        Instant createdAt
) {
}
