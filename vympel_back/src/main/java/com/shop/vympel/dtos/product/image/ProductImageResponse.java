package com.shop.vympel.dtos.product.image;

public record ProductImageResponse(
        Long id,
        String url,
        String alt,
        Integer sortOrder,
        boolean isMain
) {
}
