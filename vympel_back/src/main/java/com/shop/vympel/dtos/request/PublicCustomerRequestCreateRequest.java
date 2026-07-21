package com.shop.vympel.dtos.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PublicCustomerRequestCreateRequest(
        @Size(max = 160) @Pattern(regexp = "^[^<>]*$", message = "Name must not contain HTML") String name,
        @Size(max = 255) @Pattern(regexp = "^[^<>]*$", message = "Email must not contain HTML") String email,
        @Size(max = 80) @Pattern(regexp = "^[^<>]*$", message = "Phone must not contain HTML") String phone,
        @Size(max = 2000) @Pattern(regexp = "^[^<>]*$", message = "Message must not contain HTML") String message,
        @Size(max = 120) @Pattern(regexp = "^[A-Za-z0-9._:-]*$", message = "Source has unsupported characters") String source,
        @Size(max = 120) String website
) {
}
