package com.shop.vympel.services.cms;

import com.shop.vympel.enums.CmsBlockType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CmsBlockSchemaTest {
    @Test
    void bannerIsImageOnlyAndSupportsOptionalVariants() {
        CmsBlockSchema schema = CmsBlockSchema.forType(CmsBlockType.BANNER);

        assertFalse(schema.supportsText());
        assertTrue(schema.supportsImage());
        assertTrue(schema.requiresImage());
        assertTrue(schema.supportsLocalizedImages());
        assertTrue(schema.supportsMobileImage());
    }

    @Test
    void textBlockDoesNotAcceptImageFields() {
        CmsBlockSchema schema = CmsBlockSchema.forType(CmsBlockType.TEXT_BLOCK);

        assertTrue(schema.supportsText());
        assertTrue(schema.requiresText());
        assertFalse(schema.supportsImage());
        assertFalse(schema.supportsLocalizedImages());
        assertFalse(schema.supportsMobileImage());
    }
}
