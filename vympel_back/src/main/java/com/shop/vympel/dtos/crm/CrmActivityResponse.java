package com.shop.vympel.dtos.crm;

import java.time.Instant;
import java.util.Map;

public record CrmActivityResponse(
        Long id,
        Long actorUserId,
        String actorEmail,
        String actorRole,
        String eventType,
        String entityType,
        Long entityId,
        Map<String, Object> metadata,
        String ipAddress,
        String userAgent,
        Instant createdAt
) {
}
