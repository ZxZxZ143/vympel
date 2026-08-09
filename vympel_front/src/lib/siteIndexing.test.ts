import {describe, expect, it} from "vitest";

import {readSiteIndexingPolicy} from "../../site-indexing.mjs";

describe("site indexing release policy", () => {
    it.each([undefined, "", "false", " FALSE "])(
        "fails closed when SITE_INDEXING_ENABLED is %s",
        (value) => {
            expect(readSiteIndexingPolicy({
                SITE_INDEXING_ENABLED: value,
                NEXT_PUBLIC_SITE_URL: "https://preview.example.test",
            })).toEqual({enabled: false});
        },
    );

    it("enables indexing only for an explicitly approved HTTPS origin", () => {
        expect(readSiteIndexingPolicy({
            SITE_INDEXING_ENABLED: "true",
            NEXT_PUBLIC_SITE_URL: "https://shop.example.test",
        })).toEqual({
            enabled: true,
            approvedOrigin: "https://shop.example.test",
        });
    });

    it.each([
        ["yes", "https://shop.example.test"],
        ["true", "http://shop.example.test"],
        ["true", "https://shop.example.test/path"],
        ["true", undefined],
    ])("rejects contradictory configuration (%s, %s)", (enabled, origin) => {
        expect(() => readSiteIndexingPolicy({
            SITE_INDEXING_ENABLED: enabled,
            NEXT_PUBLIC_SITE_URL: origin,
        })).toThrow(/SITE_INDEXING_ENABLED/);
    });
});
