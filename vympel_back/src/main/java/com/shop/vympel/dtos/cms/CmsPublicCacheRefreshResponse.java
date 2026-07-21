package com.shop.vympel.dtos.cms;

public record CmsPublicCacheRefreshResponse(
        boolean contentSaved,
        boolean attempted,
        boolean refreshed,
        String status,
        String message,
        String requestId
) {
    public static CmsPublicCacheRefreshResponse notRequired() {
        return new CmsPublicCacheRefreshResponse(true, false, false, "NOT_REQUIRED", "NOT_REQUIRED", null);
    }

    public static CmsPublicCacheRefreshResponse success(String requestId) {
        return new CmsPublicCacheRefreshResponse(true, true, true, "SUCCESS", "REFRESHED", requestId);
    }

    public static CmsPublicCacheRefreshResponse retryScheduled(String requestId, String message) {
        return new CmsPublicCacheRefreshResponse(
                true,
                true,
                false,
                "FAILED_RETRY_SCHEDULED",
                message,
                requestId
        );
    }

    public static CmsPublicCacheRefreshResponse notConfigured(String requestId) {
        return new CmsPublicCacheRefreshResponse(
                true,
                false,
                false,
                "FAILED_NOT_CONFIGURED",
                "NOT_CONFIGURED",
                requestId
        );
    }

    public static CmsPublicCacheRefreshResponse permanentFailure(String requestId, String message) {
        return new CmsPublicCacheRefreshResponse(
                true,
                true,
                false,
                "FAILED_PERMANENT",
                message,
                requestId
        );
    }
}
