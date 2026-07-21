package com.shop.vympel.dtos.cms;

public record CmsMediaCleanupResponse(
        String requestId,
        int processed,
        int succeeded,
        int failed,
        int skipped
) {
}
