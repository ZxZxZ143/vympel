package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CrmUserRolesRequest(
        @NotEmpty
        Set<@NotBlank @Size(max = 50) String> roles
) {
}
