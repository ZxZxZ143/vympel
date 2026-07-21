package com.shop.vympel.dtos.product;

import java.util.List;

public record ProductBatchSummaryResponse(
        List<ProductBatchSummaryItemResponse> items,
        List<Long> missingIds
) {
}
