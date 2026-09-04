package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrmReferenceCreateRequest(
        @NotBlank @Size(max = 100) String ru,
        @Size(max = 100) String kz,
        @Size(max = 100) String en
) {
}
