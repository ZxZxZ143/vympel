package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrmCollectionTranslationRequest(
        @NotBlank
        @Size(max = 255)
        String name,

        @NotBlank
        @Size(max = 5000)
        String description
) {
}
