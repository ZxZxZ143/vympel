package com.shop.vympel.dtos.request;

import java.time.Instant;

public record CrmCustomerRequestResponse(
        Long id,
        String name,
        String email,
        String phone,
        String message,
        String source,
        String status,
        Instant createdAt,
        Instant updatedAt,
        Instant processedAt,
        String processedBy,
        String adminComment
) {
}
