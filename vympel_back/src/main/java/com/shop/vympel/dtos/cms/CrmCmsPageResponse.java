package com.shop.vympel.dtos.cms;

import com.shop.vympel.enums.CmsPageStatus;

import java.util.List;

public record CrmCmsPageResponse(
        Long id,
        String pageKey,
        String title,
        CmsPageStatus status,
        List<CrmCmsBlockResponse> blocks
) {
}
