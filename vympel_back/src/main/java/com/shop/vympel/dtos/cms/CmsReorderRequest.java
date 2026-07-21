package com.shop.vympel.dtos.cms;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CmsReorderRequest(@NotNull @PositiveOrZero Integer sortOrder) {
}
