import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {afterEach, describe, expect, it, vi} from "vitest";

import {LocaleEnum} from "@/i18n/routing";
import ProductRecommendations, {loadProductRecommendations} from "./index";

vi.mock("@/components/ui/shared/SectionWithTitle", () => ({
    default: ({title, children}: {title: string; children: React.ReactNode}) => (
        <section data-testid="recommendations">
            <h2>{title}</h2>
            {children}
        </section>
    ),
}));

vi.mock("@/components/ui/shared/GoodsCarouselWithImage", () => ({
    default: ({items}: {items: Array<{id: number; name: string}>}) => (
        <div>{items.map((item) => <span key={item.id}>{item.name}</span>)}</div>
    ),
}));

const product = {
    id: 28,
    name: "Test watch",
    price: 120000,
    stockQuantity: 3,
    status: "ACTIVE",
    imageUrl: null,
    collection: null,
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("ProductRecommendations", () => {
    it("renders valid recommendation cards", () => {
        const markup = renderToStaticMarkup(
            <ProductRecommendations title="Related products" items={[product]}/>
        );

        expect(markup).toContain("Related products");
        expect(markup).toContain("Test watch");
        expect(markup).toContain('data-testid="recommendations"');
    });

    it("hides the entire section when the catalog has no valid alternative", () => {
        const markup = renderToStaticMarkup(
            <ProductRecommendations title="Related products" items={[]}/>
        );

        expect(markup).toBe("");
    });

    it("hides the entire section and logs server-side when loading fails", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const items = await loadProductRecommendations(
            "45",
            LocaleEnum.EN,
            async () => {
                throw new Error("timed out");
            }
        );
        const markup = renderToStaticMarkup(
            <ProductRecommendations title="Related products" items={items}/>
        );

        expect(items).toEqual([]);
        expect(markup).toBe("");
        expect(errorSpy).toHaveBeenCalledOnce();
        expect(errorSpy.mock.calls[0]?.[0]).toContain("productId=45 locale=en");
    });

    it("never renders recommendation empty, error, or retry copy", () => {
        const markup = renderToStaticMarkup(
            <ProductRecommendations title="Related products" items={[]}/>
        );
        const forbiddenCopy = [
            "No similar products",
            "Could not load similar products",
            "Try again",
            "Похожие товары пока не найдены",
            "Не удалось загрузить похожие товары",
            "Попробуйте ещё раз",
            "Ұқсас тауарлар әзірге табылмады",
            "Ұқсас тауарларды жүктеу мүмкін болмады",
            "Сәл кейінірек қайталап көріңіз",
        ];

        forbiddenCopy.forEach((copy) => expect(markup).not.toContain(copy));
    });
});
