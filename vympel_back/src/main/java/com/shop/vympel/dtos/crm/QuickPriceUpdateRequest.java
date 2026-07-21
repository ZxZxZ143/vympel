package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record QuickPriceUpdateRequest(
        @NotNull
        @PositiveOrZero
        Integer price
) {
}
