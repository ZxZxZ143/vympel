package com.shop.vympel.dtos.product;

public record ProductBulkErrorResponse(
        int rowIndex,
        String field,
        String message
) {
}
