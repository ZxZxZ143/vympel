import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {imageSpy} = vi.hoisted(() => ({imageSpy: vi.fn()}));

vi.mock("@/components/ui/shared/CmsResponsiveImage", () => ({
    default: (props: {decorative?: boolean; priority?: boolean}) => {
        imageSpy(props);
        return <span data-image="true"/>;
    },
}));
vi.mock("@/i18n/navigation", () => ({
    Link: ({children, href}: {children: ReactNode; href: string}) => <a href={href}>{children}</a>,
}));

import BannerItem from "@/components/HomePage/bannerCarousel/Item";

describe("BannerItem image priority", () => {
    beforeEach(() => imageSpy.mockClear());

    it("never promotes the decorative backdrop", () => {
        renderToStaticMarkup(<BannerItem url="/hero.webp" alt="Hero" priority/>);

        expect(imageSpy).toHaveBeenCalledTimes(2);
        expect(imageSpy.mock.calls[0][0]).toMatchObject({decorative: true});
        expect(imageSpy.mock.calls[0][0].priority).toBeUndefined();
        expect(imageSpy.mock.calls[1][0]).toMatchObject({priority: true, alt: "Hero"});
    });
});
