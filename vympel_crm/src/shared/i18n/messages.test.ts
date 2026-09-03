import { describe, expect, it } from "vitest";
import { locales, messages } from "@/shared/i18n/messages";

describe("CRM authentication messages", () => {
  it.each(locales)("defines session and authorization messages for %s", (locale) => {
    expect(messages[locale].common.sessionExpired).toBeTruthy();
    expect(messages[locale].common.forbiddenAction).toBeTruthy();
    expect(messages[locale].login.logoutFailed).toBeTruthy();
    expect(messages[locale].login.restoreFailed).toBeTruthy();
  });

  it.each(locales)("localizes every emitted CRM audit event for %s", (locale) => {
    const emittedEvents = [
      "ADMIN_LOGIN",
      "PRODUCT_CREATED",
      "PRODUCT_EDITED",
      "PRODUCT_PRICE_CHANGED",
      "PRODUCT_STOCK_CHANGED",
      "PRODUCT_STATUS_CHANGED",
      "PRODUCT_MARKETPLACE_LINKS_CHANGED",
      "PRODUCT_IMAGES_UPLOADED",
      "PRODUCT_IMAGES_REORDERED",
      "PRODUCT_MAIN_IMAGE_CHANGED",
      "PRODUCT_IMAGE_DELETED",
      "PRODUCT_ARCHIVED",
      "PRODUCT_BULK_CREATED",
      "PRODUCT_PROMOTION_CHANGED",
      "COLLECTION_CREATED",
      "REFERENCE_VALUE_CREATED",
      "ADMIN_CREATED_USER",
      "ADMIN_UPDATED_USER",
      "ADMIN_CHANGED_USER_ROLES",
      "ADMIN_CHANGED_USER_STATUS",
      "CMS_BLOCK_CREATED",
      "CMS_BLOCK_UPDATED",
      "CMS_BLOCK_DELETED",
      "CMS_BLOCK_REORDERED",
      "CMS_BLOCK_PUBLISHED",
      "CMS_BLOCK_UNPUBLISHED",
      "CMS_MEDIA_UPLOADED",
      "CMS_MEDIA_CLEANUP",
      "PRODUCT_REVIEW_APPROVED",
      "PRODUCT_REVIEW_REJECTED",
      "PRODUCT_REVIEW_DELETED",
      "CUSTOMER_REQUEST_STATUS_CHANGED",
      "CUSTOMER_REQUEST_COMMENT_CHANGED",
      "CUSTOMER_REQUEST_CANCELLED",
    ] as const;

    for (const event of emittedEvents) {
      expect(messages[locale].activity.events[event], `${locale}.${event}`).toBeTruthy();
    }
  });
});
