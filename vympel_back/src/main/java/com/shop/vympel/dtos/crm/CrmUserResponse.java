package com.shop.vympel.dtos.crm;

import java.time.Instant;
import java.util.List;

public record CrmUserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        Boolean enabled,
        List<String> roles,
        Instant createdAt,
        Instant updatedAt
) {
}
