package com.shop.vympel.dtos.media;

public record ResponsiveMediaBackfillItemResponse(
        Long mediaId,
        String status,
        String reason,
        Long originalBytes,
        Integer variantCount,
        Long variantBytes
) {
}
