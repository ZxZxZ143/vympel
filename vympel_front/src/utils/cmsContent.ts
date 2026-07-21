import {ICmsBlock} from "@/api/types/CmsTypes";
import {routes} from "@/config/routes";
import {LocaleEnum} from "@/i18n/routing";

export function findCmsBlock(blocks: ICmsBlock[] | undefined, blockKey: string) {
    return blocks?.find((block) => block.blockKey === blockKey) ?? null;
}

export function findCmsBlocksByType(blocks: ICmsBlock[] | undefined, blockType: ICmsBlock["blockType"]) {
    return (blocks ?? [])
        .filter((block) => block.blockType === blockType)
        .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function cmsImageUrl(block: ICmsBlock | null | undefined, fallback: string) {
    return versionedMediaUrl(block?.media, block?.updatedAt) || fallback;
}

export function cmsImageSources(
    block: ICmsBlock | null | undefined,
    locale: LocaleEnum,
    fallback: string
) {
    const version = block?.updatedAt ?? undefined;
    const defaultDesktop = versionedMediaUrl(block?.media, version);
    const defaultMobile = versionedMediaUrl(block?.mobileMedia, version);
    const localizedMobile = locale === LocaleEnum.KZ
        ? versionedMediaUrl(block?.mobileMediaKz, version)
        : locale === LocaleEnum.EN
            ? versionedMediaUrl(block?.mobileMediaEn, version)
            : defaultMobile;
    const localizedDesktop = locale === LocaleEnum.KZ
        ? versionedMediaUrl(block?.mediaKz, version)
        : locale === LocaleEnum.EN
            ? versionedMediaUrl(block?.mediaEn, version)
            : defaultDesktop;
    const desktop = localizedDesktop || defaultDesktop || fallback;
    const mobile = localizedMobile || localizedDesktop || defaultMobile || defaultDesktop || fallback;

    return {
        desktop,
        mobile,
        fallback,
    };
}

function versionedMediaUrl(
    media: ICmsBlock["media"] | undefined,
    blockVersion?: string | null
) {
    const url = media?.url?.trim();
    if (!url) {
        return null;
    }

    return appendVersion(url, media?.createdAt ?? blockVersion ?? null);
}

function appendVersion(url: string, version: string | null | undefined) {
    if (!version || url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }

    const hashIndex = url.indexOf("#");
    const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
    const separator = base.includes("?") ? "&" : "?";

    return `${base}${separator}v=${encodeURIComponent(version)}${hash}`;
}

export function cmsText(value: string | null | undefined, fallback: string) {
    const cleaned = value?.trim();
    return cleaned ? cleaned : fallback;
}

export function cmsTextList(value: string | null | undefined, fallback: string[]) {
    const cleaned = value?.trim();
    if (!cleaned) {
        return fallback;
    }

    return cleaned
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function cmsLink(block: ICmsBlock | null | undefined) {
    const target = block?.linkTarget?.trim();
    if (!block || block.linkType === "NONE" || !target) {
        return null;
    }

    if (block.linkType === "EXTERNAL_URL") {
        try {
            const url = new URL(target);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return null;
            }

            return {
                href: target,
                external: true,
                newTab: block.linkOpenBehavior === "NEW_TAB",
            };
        } catch {
            return null;
        }
    }

    if (target.startsWith("/") && !target.startsWith("//")) {
        return {
            href: target,
            external: false,
            newTab: false,
        };
    }

    if (block.linkType === "CATALOG_CATEGORY") {
        return internalLink(routes.category(target));
    }

    if (block.linkType === "BRAND_PAGE") {
        return internalLink(routes.brand(target));
    }

    if (block.linkType === "PRODUCT_PAGE") {
        return internalLink(routes.product(target));
    }

    if (block.linkType === "CATALOG_FILTER") {
        const params = new URLSearchParams(target.startsWith("?") ? target.slice(1) : target);
        if (!params.has("page")) {
            params.set("page", "1");
        }
        return internalLink(routes.catalogFromSearchParams(params));
    }

    return null;
}

function internalLink(href: string) {
    return {
        href,
        external: false,
        newTab: false,
    };
}
