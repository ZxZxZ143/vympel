package com.shop.vympel.services.objectStorage;

/** One row's outcome. Object keys are deliberately absent; ids identify the row. */
public record ResponsiveMediaConversionResult(
        ResponsiveMediaArea area,
        Long mediaId,
        ResponsiveMediaConversionStatus status,
        String reason,
        Long originalBytes,
        Integer variantCount,
        Long variantBytes
) {
    static ResponsiveMediaConversionResult of(ResponsiveMediaArea area, Long mediaId,
                                              ResponsiveMediaConversionStatus status) {
        return new ResponsiveMediaConversionResult(area, mediaId, status, null, null, null, null);
    }

    static ResponsiveMediaConversionResult of(ResponsiveMediaArea area, Long mediaId,
                                              ResponsiveMediaConversionStatus status, String reason) {
        return new ResponsiveMediaConversionResult(area, mediaId, status, reason, null, null, null);
    }
}
