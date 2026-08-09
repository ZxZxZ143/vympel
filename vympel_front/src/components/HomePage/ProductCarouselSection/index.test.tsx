import type {ReactElement} from "react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {PublicApiController} from "@/api/controllers/PublicController";
import type {Page} from "@/api/types/PageType";
import type {IProduct} from "@/api/types/ProductTypes";
import type {GoodsCarouselItem} from "@/components/ui/shared/GoodsCarouselWithImage";
import ProductCarouselSection from "@/components/HomePage/ProductCarouselSection";
import {ProductSortEnum} from "@/enums/SortEnum";
import {LocaleEnum} from "@/i18n/routing";

vi.mock("@/components/ui/shared/GoodsCarouselWithImage", () => ({
    default: "goods-carousel",
}));

vi.mock("@/components/ui/shared/SectionWithTitle", () => ({
    default: "section-with-title",
}));

const baseProps = {
    title: "Accessories",
    destinationLink: "/catalog?categoryCode=ACCESSORIES&page=1",
    locale: LocaleEnum.EN,
    categoryCode: "ACCESSORIES",
    bannerImage: "/accessories-banner.png",
    sectionId: "accessories",
};

describe("ProductCarouselSection", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("loads category products through the existing category API and maps product routes", async () => {
        const product = {
            id: 42,
            name: "Bracelet",
            price: 25950,
        } as IProduct;
        vi.spyOn(PublicApiController, "getProductsList").mockResolvedValue({
            content: [product],
        } as Page<IProduct>);

        const section = await ProductCarouselSection(baseProps) as ReactElement<{
            title: string;
            link: string;
            children: ReactElement<{
                img: string;
                fallbackImg: string;
                items: GoodsCarouselItem[];
            }>;
        }>;

        expect(PublicApiController.getProductsList).toHaveBeenCalledWith({
            lang: LocaleEnum.EN,
            categoryCode: "ACCESSORIES",
            page: 0,
            size: 20,
            sort: ProductSortEnum.NEWEST,
        });
        expect(section.props.title).toBe("Accessories");
        expect(section.props.link).toBe(baseProps.destinationLink);
        expect(section.props.children.props.img).toBe("/accessories-banner.png");
        expect(section.props.children.props.fallbackImg).toBe("/accessories-banner.png");
        expect(section.props.children.props.items).toEqual([
            expect.objectContaining({
                id: 42,
                link: "/product/42",
            }),
        ]);
    });

    it("does not render a section when the category is genuinely empty", async () => {
        vi.spyOn(PublicApiController, "getProductsList").mockResolvedValue({
            content: [],
        } as unknown as Page<IProduct>);

        await expect(ProductCarouselSection(baseProps)).resolves.toBeNull();
    });

    it("omits an awaited failed optional rail instead of rendering terminal skeletons", async () => {
        vi.spyOn(PublicApiController, "getProductsList").mockRejectedValue(new Error("offline"));
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(ProductCarouselSection(baseProps)).resolves.toBeNull();
    });
});
