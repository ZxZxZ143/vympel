import {describe, expect, it} from "vitest";
import {validateInstagramProfileUrl} from "./socialLinks";

describe("validateInstagramProfileUrl", () => {
    it.each([undefined, "", "https://www.instagram.com/", "http://instagram.com/vympel", "https://evil.test/vympel", "https://instagram.com/vympel/post"])(
        "rejects absent, generic, unsafe, or post-like values: %s",
        (value) => expect(validateInstagramProfileUrl(value)).toBeNull(),
    );

    it("normalizes an explicit approved profile", () => {
        expect(validateInstagramProfileUrl("https://instagram.com/vympel_shop"))
            .toBe("https://www.instagram.com/vympel_shop/");
    });
});
