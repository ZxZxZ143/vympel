package com.shop.vympel.dtos.cms;

import java.util.List;

public record CmsMediaOrphanPageResponse(
        List<CmsMediaOrphanCandidateResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
}
