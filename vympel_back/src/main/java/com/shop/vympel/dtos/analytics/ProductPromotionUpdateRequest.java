package com.shop.vympel.dtos.analytics;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductPromotionUpdateRequest(
        @NotNull @Size(max = 20) String promotionMode
) {
}
