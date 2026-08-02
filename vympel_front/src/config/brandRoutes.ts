export type BrandSlug =
    | "romanson"
    | "adriatica"
    | "appella"
    | "pierre-ricaud"
    | "rhythm"
    | "royal-london";

export type PublicBrand = {
    slug: BrandSlug;
    displayName: string;
    breadcrumbName: string;
    databaseCode: string;
    matchingNames: string[];
};

export const PUBLIC_BRANDS: PublicBrand[] = [
    {
        slug: "romanson",
        displayName: "ROMANSON",
        breadcrumbName: "Romanson",
        databaseCode: "romanson",
        matchingNames: ["Romanson", "romanson"],
    },
    {
        slug: "adriatica",
        displayName: "ADRIATICA",
        breadcrumbName: "Adriatica",
        databaseCode: "adriatica",
        matchingNames: ["Adriatica", "adriatica"],
    },
    {
        slug: "appella",
        displayName: "APPELLA",
        breadcrumbName: "Appella",
        databaseCode: "appella",
        matchingNames: ["Appella", "appella"],
    },
    {
        slug: "pierre-ricaud",
        displayName: "PIERRE RICAUD",
        breadcrumbName: "Pierre Ricaud",
        databaseCode: "pierre-ricaud",
        matchingNames: ["Pierre Ricaud", "pierre-ricaud"],
    },
    {
        slug: "rhythm",
        displayName: "RHYTHM",
        breadcrumbName: "Rhythm",
        databaseCode: "rhythm",
        matchingNames: ["Rhythm", "rhythm"],
    },
    {
        slug: "royal-london",
        displayName: "ROYAL LONDON",
        breadcrumbName: "Royal London",
        databaseCode: "royal-london",
        matchingNames: ["Royal London", "royal-london"],
    },
];

export function findPublicBrandBySlug(slug: string): PublicBrand | undefined {
    const normalizedSlug = normalizeBrandLookup(slug);

    return PUBLIC_BRANDS.find((brand) => normalizeBrandLookup(brand.slug) === normalizedSlug);
}

export function normalizeBrandLookup(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
