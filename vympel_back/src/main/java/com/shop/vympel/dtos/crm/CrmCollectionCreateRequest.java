package com.shop.vympel.dtos.crm;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CrmCollectionCreateRequest(
        @NotNull
        Long brandId,

        @Valid
        @NotNull
        CrmCollectionTranslationsRequest translations
) {
}
