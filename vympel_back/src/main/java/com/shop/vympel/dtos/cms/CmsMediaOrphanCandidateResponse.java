package com.shop.vympel.dtos.cms;

import com.shop.vympel.enums.CmsMediaLifecycleStatus;

import java.time.Instant;

public record CmsMediaOrphanCandidateResponse(
        Long id,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        Instant createdAt,
        Instant orphanedAt,
        Instant eligibleAt,
        CmsMediaLifecycleStatus lifecycleStatus,
        int deleteAttemptCount,
        long referenceCount
) {
}
