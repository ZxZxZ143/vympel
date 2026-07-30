import {describe, expect, it} from "vitest";

import {
    findLegacyBrandRedirect,
    findPublicBrandBySlug,
    PUBLIC_BRANDS,
} from "@/config/brandRoutes";

describe("Appella public brand contract", () => {
    it("uses the corrected visible name and canonical slug", () => {
        const appella = findPublicBrandBySlug("appella");

        expect(appella).toMatchObject({
            slug: "appella",
            displayName: "APPELLA",
            breadcrumbName: "Appella",
            databaseCode: "appella",
        });
        expect(appella?.matchingNames).toEqual(["Appella", "appella"]);
        expect(PUBLIC_BRANDS.some((brand) => brand.displayName === "APELLA")).toBe(false);
    });

    it("redirects only the legacy misspelled slug", () => {
        expect(findLegacyBrandRedirect("apella")).toBe("appella");
        expect(findLegacyBrandRedirect("APELLA")).toBe("appella");
        expect(findLegacyBrandRedirect("appella")).toBeUndefined();
    });
});
