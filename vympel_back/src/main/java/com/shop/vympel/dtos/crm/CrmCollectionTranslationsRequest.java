package com.shop.vympel.dtos.crm;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CrmCollectionTranslationsRequest(
        @Valid
        @NotNull
        CrmCollectionTranslationRequest ru,

        @Valid
        @NotNull
        CrmCollectionTranslationRequest en,

        @Valid
        @NotNull
        CrmCollectionTranslationRequest kz
) {
}
