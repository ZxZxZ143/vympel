package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.NotNull;

public record CrmUserStatusRequest(
        @NotNull
        Boolean enabled
) {
}
