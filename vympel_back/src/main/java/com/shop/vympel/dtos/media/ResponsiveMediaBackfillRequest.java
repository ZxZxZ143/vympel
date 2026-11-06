package com.shop.vympel.dtos.media;

import com.shop.vympel.services.objectStorage.ResponsiveMediaArea;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** {@code dryRun} defaults to true: a write happens only when it is explicitly false. */
public record ResponsiveMediaBackfillRequest(
        @NotNull(message = "Media area is required")
        ResponsiveMediaArea area,
        Boolean dryRun,
        @PositiveOrZero(message = "afterId must not be negative")
        Long afterId,
        @Min(value = 1, message = "limit must be at least 1")
        @Max(value = 25, message = "limit must be at most 25")
        Integer limit
) {
    public boolean effectiveDryRun() {
        return !Boolean.FALSE.equals(dryRun);
    }

    public long effectiveAfterId() {
        return afterId == null ? 0L : afterId;
    }

    public int effectiveLimit() {
        return limit == null ? 10 : limit;
    }
}
