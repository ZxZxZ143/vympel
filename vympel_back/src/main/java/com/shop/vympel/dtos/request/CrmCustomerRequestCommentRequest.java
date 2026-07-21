package com.shop.vympel.dtos.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrmCustomerRequestCommentRequest(
        @Size(max = 2000) @Pattern(regexp = "^[^<>]*$", message = "Comment must not contain HTML") String adminComment
) {
}
