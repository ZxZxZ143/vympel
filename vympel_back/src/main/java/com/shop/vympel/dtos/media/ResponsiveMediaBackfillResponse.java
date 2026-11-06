package com.shop.vympel.dtos.media;

import java.util.List;
import java.util.Map;

public record ResponsiveMediaBackfillResponse(
        String area,
        boolean dryRun,
        long nextAfterId,
        boolean hasMore,
        Map<String, Integer> summary,
        List<ResponsiveMediaBackfillItemResponse> items
) {
}
