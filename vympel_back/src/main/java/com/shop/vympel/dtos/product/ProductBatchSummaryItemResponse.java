package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.features.FeatureDto;

public record ProductBatchSummaryItemResponse(
        Long id,
        String name,
        String model,
        String sku,
        Integer price,
        Integer stockQuantity,
        String status,
        String imageUrl,
        String kaspiUrl,
        String wildberriesUrl,
        CollectionResponse collection,
        FeatureDto brand,
        String categoryCode,
        String categoryName,
        Double ratingAverage,
        Long ratingCount
) {
}
