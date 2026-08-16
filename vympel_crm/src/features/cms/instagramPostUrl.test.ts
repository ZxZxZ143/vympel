import { describe, expect, it } from "vitest";
import { canonicalInstagramPostUrl } from "./instagramPostUrl";

describe("canonicalInstagramPostUrl", () => {
  it("canonicalizes post and reel links", () => {
    expect(canonicalInstagramPostUrl("https://instagram.com/p/AbC_12?igsh=tracking"))
      .toBe("https://www.instagram.com/p/AbC_12/");
    expect(canonicalInstagramPostUrl("https://www.instagram.com/reel/xyz-9/"))
      .toBe("https://www.instagram.com/reel/xyz-9/");
  });

  it.each([
    "javascript:alert(1)",
    "http://instagram.com/p/abc",
    "https://fakeinstagram.com/p/abc",
    "https://instagram.com.evil.test/p/abc",
    "https://instagram.com:443/p/abc",
    "https://instagram.com/",
    "https://instagram.com/p/abc/embed",
  ])("rejects unsafe or malformed links", (value) => {
    expect(canonicalInstagramPostUrl(value)).toBeNull();
  });
});
