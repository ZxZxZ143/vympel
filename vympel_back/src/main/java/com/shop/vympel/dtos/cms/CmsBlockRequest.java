package com.shop.vympel.dtos.cms;

import com.shop.vympel.enums.CmsBlockStatus;
import com.shop.vympel.enums.CmsBlockType;
import com.shop.vympel.enums.CmsLinkOpenBehavior;
import com.shop.vympel.enums.CmsLinkType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CmsBlockRequest(
        @NotBlank @Size(max = 120) String pageKey,
        @NotBlank @Size(max = 160) String blockKey,
        @NotNull CmsBlockType blockType,
        @PositiveOrZero Integer sortOrder,
        CmsBlockStatus status,
        @Pattern(regexp = "^[^<>]*$", message = "Settings must not contain HTML") String settingsJson,
        Long mediaId,
        Long mediaKzId,
        Long mediaEnId,
        Long mobileMediaId,
        Long mobileMediaKzId,
        Long mobileMediaEnId,
        @NotNull CmsLinkType linkType,
        @Pattern(regexp = "^[^<>]*$", message = "Link target must not contain HTML") String linkTarget,
        @NotNull CmsLinkOpenBehavior linkOpenBehavior,
        Map<String, @Valid CmsTranslationRequest> translations
) {
}
