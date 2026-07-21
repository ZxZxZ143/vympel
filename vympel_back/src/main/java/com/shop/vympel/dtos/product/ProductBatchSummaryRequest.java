package com.shop.vympel.dtos.product;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductBatchSummaryRequest(
        @NotEmpty @Size(max = 60) List<@NotNull @Positive Long> ids
) {
}
