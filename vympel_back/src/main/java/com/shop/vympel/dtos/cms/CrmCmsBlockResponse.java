package com.shop.vympel.dtos.cms;

import com.shop.vympel.enums.CmsBlockStatus;
import com.shop.vympel.enums.CmsBlockType;
import com.shop.vympel.enums.CmsLinkOpenBehavior;
import com.shop.vympel.enums.CmsLinkType;

import java.time.Instant;
import java.util.Map;

public record CrmCmsBlockResponse(
        Long id,
        String pageKey,
        String blockKey,
        CmsBlockType blockType,
        Integer sortOrder,
        CmsBlockStatus status,
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
        Map<String, CmsTranslationResponse> translations,
        Instant createdAt,
        Instant updatedAt,
        CmsPublicCacheRefreshResponse publicCacheRefresh
) {
    public CrmCmsBlockResponse withPublicCacheRefresh(CmsPublicCacheRefreshResponse refresh) {
        return new CrmCmsBlockResponse(
                id,
                pageKey,
                blockKey,
                blockType,
                sortOrder,
                status,
                settingsJson,
                media,
                mediaKz,
                mediaEn,
                mobileMedia,
                mobileMediaKz,
                mobileMediaEn,
                linkType,
                linkTarget,
                linkOpenBehavior,
                translations,
                createdAt,
                updatedAt,
                refresh
        );
    }
}
