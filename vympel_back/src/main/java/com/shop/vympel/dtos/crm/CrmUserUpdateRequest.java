package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CrmUserUpdateRequest(
        @Email
        @Size(max = 255)
        String email,

        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        @Size(max = 50)
        String phone,

        Set<String> roles,

        Boolean enabled
) {
}
