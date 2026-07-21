package com.shop.vympel.dtos.cms;

import com.shop.vympel.enums.CmsPageStatus;

public record CrmCmsPageSummaryResponse(
        Long id,
        String pageKey,
        String title,
        CmsPageStatus status,
        int blockCount
) {
}
