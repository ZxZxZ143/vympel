package com.shop.vympel.services.cms;

import com.shop.vympel.enums.CmsBlockType;

public record CmsBlockSchema(
        boolean supportsText,
        boolean requiresText,
        boolean supportsImage,
        boolean requiresImage,
        boolean supportsLink,
        boolean supportsButton,
        boolean supportsAltText,
        boolean supportsExtraJson,
        boolean supportsLocalizedImages,
        boolean supportsMobileImage,
        boolean supportsSettings
) {
    public static CmsBlockSchema forType(CmsBlockType type) {
        return switch (type) {
            case HERO_SLIDER -> new CmsBlockSchema(
                    true, false, true, true, true, true, true, false, true, true, true
            );
            case BANNER -> new CmsBlockSchema(
                    false, false, true, true, true, false, true, false, true, true, false
            );
            case TEXT_BLOCK -> new CmsBlockSchema(
                    true, true, false, false, false, false, false, false, false, false, false
            );
            case IMAGE_TEXT_BLOCK -> new CmsBlockSchema(
                    true, true, true, true, true, true, true, false, true, true, false
            );
            case LINK_CARD -> new CmsBlockSchema(
                    true, true, true, false, true, true, true, false, true, true, false
            );
            case MARKETPLACE_LINK -> new CmsBlockSchema(
                    false, false, true, true, true, false, true, false, true, true, false
            );
            case FOOTER_LINK_GROUP -> new CmsBlockSchema(
                    true, true, false, false, true, false, false, false, false, false, false
            );
            case CUSTOM_JSON -> new CmsBlockSchema(
                    false, false, false, false, false, false, false, true, false, false, true
            );
        };
    }
}
