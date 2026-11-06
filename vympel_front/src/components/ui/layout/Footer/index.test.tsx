import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import en from "@/messages/en.json";
import kz from "@/messages/kz.json";
import ru from "@/messages/ru.json";
import {CONTACT_LINKS} from "@/config/routes";

const localeMessages = {ru, en, kz};
let activeMessages: typeof ru = ru;

vi.mock("@/i18n/navigation", () => ({
    Link: ({href, children, ...props}: {href: string; children: ReactNode}) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("use-intl", () => ({
    useTranslations: (namespace: keyof typeof ru) => (key: string) => {
        const value = (activeMessages[namespace] as Record<string, unknown>)[key];
        if (typeof value !== "string") throw new Error(`Missing ${namespace}.${key}`);
        return value;
    },
}));

const {default: Footer} = await import(".");

const storeLinks = (html: string) => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter((match) => match[1].includes(`href="${CONTACT_LINKS.storeMap}"`));

describe("footer store link", () => {
    it("points to the 2GIS store card", () => {
        expect(CONTACT_LINKS.storeMap).toBe("https://2gis.kz/almaty/geo/70000001028382844");
    });

    it.each(Object.entries(localeMessages))("opens the store map in a new tab in %s", (_locale, messages) => {
        activeMessages = messages;
        const links = storeLinks(renderToStaticMarkup(<Footer/>));

        // Mobile card and desktop column both render the label.
        expect(links).toHaveLength(2);
        links.forEach(([, attributes, content]) => {
            expect(attributes).toContain('target="_blank"');
            expect(attributes).toContain('rel="noopener noreferrer"');
            expect(content).toContain(messages.footer.shop);
            // The accessible name keeps the visible label first (WCAG 2.5.3).
            expect(attributes).toContain(`aria-label="${messages.footer.shopAria}"`);
            expect(messages.footer.shopAria.startsWith(messages.footer.shop)).toBe(true);
        });
    });
});
