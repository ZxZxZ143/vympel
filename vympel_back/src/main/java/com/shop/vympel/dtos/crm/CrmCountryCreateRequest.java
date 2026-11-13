package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrmCountryCreateRequest(
        @NotBlank
        @Pattern(regexp = "^\\s*[A-Za-z]{2}\\s*$")
        String iso2,

        @NotBlank
        @Size(max = 255)
        String nameRu,

        @NotBlank
        @Size(max = 255)
        String nameEn,

        @NotBlank
        @Size(max = 255)
        String nameKz
) {
}
