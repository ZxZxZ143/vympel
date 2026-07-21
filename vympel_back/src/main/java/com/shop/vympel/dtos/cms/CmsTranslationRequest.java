package com.shop.vympel.dtos.cms;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CmsTranslationRequest(
        @Size(max = 255) @Pattern(regexp = "^[^<>]*$", message = "Title must not contain HTML") String title,
        @Size(max = 255) @Pattern(regexp = "^[^<>]*$", message = "Subtitle must not contain HTML") String subtitle,
        @Pattern(regexp = "^[^<>]*$", message = "Description must not contain HTML") String description,
        @Size(max = 160) @Pattern(regexp = "^[^<>]*$", message = "Button text must not contain HTML") String buttonText,
        @Size(max = 255) @Pattern(regexp = "^[^<>]*$", message = "Alt text must not contain HTML") String altText,
        @Pattern(regexp = "^[^<>]*$", message = "Extra JSON must not contain HTML") String extraJson
) {
}
