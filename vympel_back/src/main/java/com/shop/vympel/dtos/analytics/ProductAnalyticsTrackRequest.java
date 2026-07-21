package com.shop.vympel.dtos.analytics;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ProductAnalyticsTrackRequest(
        @NotNull @Positive Long productId,
        @NotBlank @Size(max = 40) String eventType,
        @Size(max = 100) String sessionId
) {
}
