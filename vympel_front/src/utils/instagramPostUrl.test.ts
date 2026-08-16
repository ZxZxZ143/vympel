import {describe, expect, it} from "vitest";
import {canonicalInstagramPostUrl} from "@/utils/instagramPostUrl";

describe("canonicalInstagramPostUrl", () => {
    it.each([
        ["https://instagram.com/p/AbC_12-3?igsh=tracking", "https://www.instagram.com/p/AbC_12-3/"],
        ["https://www.instagram.com/reel/xyz987/#fragment", "https://www.instagram.com/reel/xyz987/"],
    ])("canonicalizes supported Instagram destinations", (input, expected) => {
        expect(canonicalInstagramPostUrl(input)).toBe(expected);
    });

    it.each([
        null,
        "",
        "javascript:alert(1)",
        "http://instagram.com/p/abc",
        "https://instagram.com.evil.test/p/abc",
        "https://instagram.com:443/p/abc",
        "https://instagram.com/",
        "https://instagram.com/stories/abc",
        "https://instagram.com/p/abc/embed",
        "https://instagram.com/p/abc%2Fembed",
    ])("rejects unsafe or malformed destinations", (input) => {
        expect(canonicalInstagramPostUrl(input)).toBeNull();
    });
});
