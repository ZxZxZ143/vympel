package com.shop.vympel.dtos.cms;

public record CmsTranslationResponse(
        String lang,
        String title,
        String subtitle,
        String description,
        String buttonText,
        String altText,
        String extraJson
) {
}
