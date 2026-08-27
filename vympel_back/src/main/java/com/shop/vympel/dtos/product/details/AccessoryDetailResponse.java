package com.shop.vympel.dtos.product.details;

import com.shop.vympel.dtos.product.features.FeatureDto;

public record AccessoryDetailResponse(
        Long productId,
        String claspType,
        FeatureDto caseMaterial,
        FeatureDto insertMaterial,
        Boolean hasInsert,
        FeatureDto color,
        String length
) {
}
