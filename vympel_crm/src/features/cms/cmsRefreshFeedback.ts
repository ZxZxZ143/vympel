import type { CmsPublicCacheRefresh } from "@/shared/api/types";

export function cmsRefreshFeedbackKey(refresh: CmsPublicCacheRefresh | null) {
  if (!refresh || refresh.status === "NOT_REQUIRED" || refresh.status === "SUCCESS") {
    return null;
  }
  if (refresh.status === "FAILED_RETRY_SCHEDULED") {
    return "cms.cacheRefreshPending";
  }
  if (refresh.status === "FAILED_NOT_CONFIGURED") {
    return "cms.cacheRefreshNotConfigured";
  }
  return "cms.cacheRefreshFailed";
}
