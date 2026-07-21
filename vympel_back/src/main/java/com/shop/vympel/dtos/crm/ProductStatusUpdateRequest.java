package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProductStatusUpdateRequest(
        @NotBlank
        @Size(max = 20)
        @Pattern(regexp = "ACTIVE|DRAFT|ARCHIVED", message = "Unsupported product status")
        String status
) {
}
