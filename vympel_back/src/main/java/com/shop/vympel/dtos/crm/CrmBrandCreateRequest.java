package com.shop.vympel.dtos.crm;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Creates a brand bound to exactly one country: either an existing {@code countryId}
 * or a {@code newCountry} created in the same transaction.
 */
public record CrmBrandCreateRequest(
        @NotBlank
        @Size(max = 100)
        String name,

        Long countryId,

        @Valid
        CrmCountryCreateRequest newCountry
) {
    @AssertTrue(message = "Exactly one of countryId or newCountry must be provided")
    public boolean isCountryChoiceValid() {
        return (countryId == null) != (newCountry == null);
    }
}
