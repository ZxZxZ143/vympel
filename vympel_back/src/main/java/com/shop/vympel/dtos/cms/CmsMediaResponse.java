package com.shop.vympel.dtos.cms;

import com.shop.vympel.enums.CmsMediaStorageType;

import java.time.Instant;

public record CmsMediaResponse(
        Long id,
        CmsMediaStorageType storageType,
        String publicUrl,
        String url,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        Instant createdAt
) {
}
