package com.shop.vympel.dtos.cms;

import java.util.List;
import java.time.Instant;

public record PublicCmsPageResponse(
        String pageKey,
        String title,
        List<PublicCmsBlockResponse> blocks,
        Instant updatedAt,
        List<CmsCategoryBannerResponse> categoryBanners
) {
    public PublicCmsPageResponse(String pageKey, String title, List<PublicCmsBlockResponse> blocks, Instant updatedAt) {
        this(pageKey, title, blocks, updatedAt, List.of());
    }
}
