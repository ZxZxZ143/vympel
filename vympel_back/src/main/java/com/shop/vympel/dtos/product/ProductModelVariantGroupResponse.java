package com.shop.vympel.dtos.product;

import java.util.List;

public record ProductModelVariantGroupResponse(
        String model,
        int total,
        boolean truncated,
        List<ProductModelVariantResponse> variants
) {
    public static ProductModelVariantGroupResponse empty() {
        return new ProductModelVariantGroupResponse("", 0, false, List.of());
    }
}
