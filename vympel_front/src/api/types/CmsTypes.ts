import {LocaleEnum} from "@/i18n/routing";

export type CmsBlockType =
    | "HERO_SLIDER"
    | "BANNER"
    | "TEXT_BLOCK"
    | "IMAGE_TEXT_BLOCK"
    | "LINK_CARD"
    | "MARKETPLACE_LINK"
    | "FOOTER_LINK_GROUP"
    | "CUSTOM_JSON";

export type CmsLinkType =
    | "INTERNAL_ROUTE"
    | "CATALOG_CATEGORY"
    | "CATALOG_FILTER"
    | "BRAND_PAGE"
    | "PRODUCT_PAGE"
    | "EXTERNAL_URL"
    | "NONE";

export type CmsLinkOpenBehavior = "SAME_TAB" | "NEW_TAB";

export type ICmsMedia = {
    id: number;
    storageType: "OBJECT_STORAGE" | "PUBLIC_PATH";
    publicUrl: string | null;
    url: string | null;
    originalFilename: string | null;
    contentType: string | null;
    sizeBytes: number;
    createdAt: string | null;
};

export type ICmsTranslation = {
    lang: LocaleEnum;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    buttonText: string | null;
    altText: string | null;
    extraJson: string | null;
};

export type ICmsBlock = {
    id: number;
    pageKey: string;
    blockKey: string;
    blockType: CmsBlockType;
    sortOrder: number;
    settingsJson: string | null;
    media: ICmsMedia | null;
    mediaKz: ICmsMedia | null;
    mediaEn: ICmsMedia | null;
    mobileMedia: ICmsMedia | null;
    mobileMediaKz: ICmsMedia | null;
    mobileMediaEn: ICmsMedia | null;
    linkType: CmsLinkType;
    linkTarget: string | null;
    linkOpenBehavior: CmsLinkOpenBehavior;
    translation: ICmsTranslation | null;
    updatedAt: string | null;
};

export type ICmsPage = {
    pageKey: string;
    title: string | null;
    blocks: ICmsBlock[];
    updatedAt: string | null;
};
