import {SortValue} from "@/components/CatalogPage/Catalog/Sort/type";

export const sortOptions: { labelKey: string; shortLabelKey: string; value: SortValue }[] = [
    { labelKey: "priceAsc", shortLabelKey: "short.priceAsc", value: "priceAsc" },
    { labelKey: "priceDesc", shortLabelKey: "short.priceDesc", value: "priceDesc" },
    { labelKey: "newest", shortLabelKey: "short.newest", value: "newest" },
    { labelKey: "oldest", shortLabelKey: "short.oldest", value: "oldest" },
];
