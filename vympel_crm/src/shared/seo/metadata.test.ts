import {describe, expect, it} from "vitest";

import {CRM_PRIVATE_METADATA} from "./metadata";

describe("CRM indexing policy", () => {
  it("sets noindex and nofollow for every page through the root layout", () => {
    expect(CRM_PRIVATE_METADATA.robots).toMatchObject({
      index: false,
      follow: false,
      googleBot: {index: false, follow: false},
    });
  });
});
