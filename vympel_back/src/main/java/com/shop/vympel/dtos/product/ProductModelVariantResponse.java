package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.image.ProductImageResponse;

public record ProductModelVariantResponse(
        Long id,
        String name,
        String model,
        String status,
        ProductImageResponse mainImage
) {
}
