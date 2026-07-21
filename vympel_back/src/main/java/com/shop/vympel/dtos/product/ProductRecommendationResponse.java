package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;

public record ProductRecommendationResponse(
        Long id,
        String name,
        String model,
        Integer price,
        Integer stockQuantity,
        String status,
        String imageUrl,
        String kaspiUrl,
        String wildberriesUrl,
        CollectionResponse collection,
        Double ratingAverage,
        Long ratingCount
) {
}
