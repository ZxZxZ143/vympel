package com.shop.vympel.controllers;

import com.shop.vympel.dtos.media.ResponsiveMediaBackfillItemResponse;
import com.shop.vympel.dtos.media.ResponsiveMediaBackfillRequest;
import com.shop.vympel.dtos.media.ResponsiveMediaBackfillResponse;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.objectStorage.ResponsiveMediaBackfillService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** ADMIN-only bounded conversion of legacy product/CMS images into responsive WebP families. */
@RestController
@RequestMapping("/api/crm/media")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CrmMediaController {
    private final ResponsiveMediaBackfillService backfillService;
    private final CrmActivityService crmActivityService;

    @PostMapping("/responsive-backfill")
    public ResponsiveMediaBackfillResponse backfill(
            @RequestBody @Valid ResponsiveMediaBackfillRequest request,
            HttpServletRequest servletRequest
    ) {
        var batch = backfillService.run(request.area(), request.effectiveDryRun(), request.effectiveAfterId(),
                request.effectiveLimit());
        Map<String, Integer> summary = new LinkedHashMap<>();
        batch.summary().forEach((status, count) -> summary.put(status.name(), count));
        var response = new ResponsiveMediaBackfillResponse(
                batch.area().name(),
                batch.dryRun(),
                batch.nextAfterId(),
                batch.hasMore(),
                summary,
                batch.items().stream().map(item -> new ResponsiveMediaBackfillItemResponse(
                        item.mediaId(),
                        item.status().name(),
                        item.reason(),
                        item.originalBytes(),
                        item.variantCount(),
                        item.variantBytes()
                )).toList()
        );
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("area", response.area());
        metadata.put("dryRun", response.dryRun());
        metadata.put("afterId", request.effectiveAfterId());
        metadata.put("nextAfterId", response.nextAfterId());
        metadata.put("summary", summary);
        crmActivityService.log("MEDIA_RESPONSIVE_BACKFILL", "MEDIA", null, metadata, servletRequest);
        return response;
    }
}
