package com.shop.vympel.dtos.product.image;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ProductImageOrderRequest(
        @NotEmpty
        List<@NotNull Long> imageIds
) {
}
