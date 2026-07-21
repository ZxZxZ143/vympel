package com.shop.vympel.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrmCustomerRequestStatusUpdateRequest(
        @NotBlank @Size(max = 20) String status
) {
}
