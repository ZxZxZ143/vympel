package com.shop.vympel.dtos.cms;

import com.shop.vympel.enums.CmsBlockType;
import com.shop.vympel.enums.CmsLinkOpenBehavior;
import com.shop.vympel.enums.CmsLinkType;

import java.time.Instant;

public record PublicCmsBlockResponse(
        Long id,
        String pageKey,
        String blockKey,
        CmsBlockType blockType,
        Integer sortOrder,
        String settingsJson,
        CmsMediaResponse media,
        CmsMediaResponse mediaKz,
        CmsMediaResponse mediaEn,
        CmsMediaResponse mobileMedia,
        CmsMediaResponse mobileMediaKz,
        CmsMediaResponse mobileMediaEn,
        CmsLinkType linkType,
        String linkTarget,
        CmsLinkOpenBehavior linkOpenBehavior,
        CmsTranslationResponse translation,
        Instant updatedAt
) {
}
