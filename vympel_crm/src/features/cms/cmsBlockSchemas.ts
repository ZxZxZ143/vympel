import { CmsBlockType } from "@/shared/api/types";

export type CmsBlockSchema = {
  supportsText: boolean;
  requiresText: boolean;
  supportsImage: boolean;
  requiresImage: boolean;
  supportsLink: boolean;
  supportsButton: boolean;
  supportsAltText: boolean;
  supportsExtraJson: boolean;
  supportsLocalizedImages: boolean;
  supportsMobileImage: boolean;
  supportsSettings: boolean;
};

export const cmsBlockSchemas: Record<CmsBlockType, CmsBlockSchema> = {
  HERO_SLIDER: {
    supportsText: true,
    requiresText: false,
    supportsImage: true,
    requiresImage: true,
    supportsLink: true,
    supportsButton: true,
    supportsAltText: true,
    supportsExtraJson: false,
    supportsLocalizedImages: true,
    supportsMobileImage: true,
    supportsSettings: true,
  },
  BANNER: {
    supportsText: false,
    requiresText: false,
    supportsImage: true,
    requiresImage: true,
    supportsLink: true,
    supportsButton: false,
    supportsAltText: true,
    supportsExtraJson: false,
    supportsLocalizedImages: true,
    supportsMobileImage: true,
    supportsSettings: false,
  },
  TEXT_BLOCK: {
    supportsText: true,
    requiresText: true,
    supportsImage: false,
    requiresImage: false,
    supportsLink: false,
    supportsButton: false,
    supportsAltText: false,
    supportsExtraJson: false,
    supportsLocalizedImages: false,
    supportsMobileImage: false,
    supportsSettings: false,
  },
  IMAGE_TEXT_BLOCK: {
    supportsText: true,
    requiresText: true,
    supportsImage: true,
    requiresImage: true,
    supportsLink: true,
    supportsButton: true,
    supportsAltText: true,
    supportsExtraJson: false,
    supportsLocalizedImages: true,
    supportsMobileImage: true,
    supportsSettings: false,
  },
  LINK_CARD: {
    supportsText: true,
    requiresText: true,
    supportsImage: true,
    requiresImage: false,
    supportsLink: true,
    supportsButton: true,
    supportsAltText: true,
    supportsExtraJson: false,
    supportsLocalizedImages: true,
    supportsMobileImage: true,
    supportsSettings: false,
  },
  MARKETPLACE_LINK: {
    supportsText: false,
    requiresText: false,
    supportsImage: true,
    requiresImage: true,
    supportsLink: true,
    supportsButton: false,
    supportsAltText: true,
    supportsExtraJson: false,
    supportsLocalizedImages: true,
    supportsMobileImage: true,
    supportsSettings: false,
  },
  FOOTER_LINK_GROUP: {
    supportsText: true,
    requiresText: true,
    supportsImage: false,
    requiresImage: false,
    supportsLink: true,
    supportsButton: false,
    supportsAltText: false,
    supportsExtraJson: false,
    supportsLocalizedImages: false,
    supportsMobileImage: false,
    supportsSettings: false,
  },
  CUSTOM_JSON: {
    supportsText: false,
    requiresText: false,
    supportsImage: false,
    requiresImage: false,
    supportsLink: false,
    supportsButton: false,
    supportsAltText: false,
    supportsExtraJson: true,
    supportsLocalizedImages: false,
    supportsMobileImage: false,
    supportsSettings: true,
  },
};
