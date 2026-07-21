package com.shop.vympel.dtos.cms;

public record CmsMediaReferenceResponse(
        Long blockId,
        String blockKey,
        String pageKey,
        String blockStatus,
        String slot
) {
}
