import { describe, expect, it } from "vitest";
import { CrmApiError } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";

describe("getCrmErrorMessage", () => {
  it("maps stable business error codes to localized CRM copy", () => {
    const error = new CrmApiError(
      409,
      "A main image is required before a product can be activated.",
      "PRODUCT_MAIN_IMAGE_REQUIRED"
    );

    expect(getCrmErrorMessage(error, "fallback", "validation", {
      PRODUCT_MAIN_IMAGE_REQUIRED: "localized main image message",
    })).toBe("localized main image message");
  });

  it("does not expose technical server messages", () => {
    const error = new CrmApiError(500, "org.hibernate.ConstraintViolationException: SQL", "INTERNAL_ERROR");

    expect(getCrmErrorMessage(error, "safe fallback")).toBe("safe fallback");
  });
});
