import { describe, expect, it } from "vitest";

import type { CmsPublicCacheRefresh } from "@/shared/api/types";
import { cmsRefreshFeedbackKey } from "./cmsRefreshFeedback";

function refresh(status: CmsPublicCacheRefresh["status"]): CmsPublicCacheRefresh {
  return {
    contentSaved: true,
    attempted: status !== "NOT_REQUIRED" && status !== "FAILED_NOT_CONFIGURED",
    refreshed: status === "SUCCESS",
    status,
    message: status,
    requestId: "request-id",
  };
}

describe("CMS refresh feedback", () => {
  it("keeps full success and explicitly disabled refresh quiet", () => {
    expect(cmsRefreshFeedbackKey(refresh("SUCCESS"))).toBeNull();
    expect(cmsRefreshFeedbackKey(refresh("NOT_REQUIRED"))).toBeNull();
  });

  it("distinguishes retryable partial success from permanent/configuration failure", () => {
    expect(cmsRefreshFeedbackKey(refresh("FAILED_RETRY_SCHEDULED"))).toBe("cms.cacheRefreshPending");
    expect(cmsRefreshFeedbackKey(refresh("FAILED_NOT_CONFIGURED"))).toBe("cms.cacheRefreshNotConfigured");
    expect(cmsRefreshFeedbackKey(refresh("FAILED_PERMANENT"))).toBe("cms.cacheRefreshFailed");
  });
});
