package com.shop.vympel.dtos.product;

import java.util.List;

public record ProductBulkCreateResponse(
        int createdCount,
        int failedCount,
        List<ProductBulkCreatedProductResponse> createdProducts,
        List<ProductBulkErrorResponse> errors
) {
}
