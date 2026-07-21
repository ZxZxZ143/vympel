package com.shop.vympel.dtos.crm;

import java.time.Instant;

public record CrmCollectionResponse(
        Long id,
        Long brandId,
        String brandName,
        String code,
        String name,
        String description,
        Boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
