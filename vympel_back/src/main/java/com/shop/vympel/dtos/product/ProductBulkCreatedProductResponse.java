package com.shop.vympel.dtos.product;

public record ProductBulkCreatedProductResponse(
        int rowIndex,
        Long id,
        String sku
) {
}
