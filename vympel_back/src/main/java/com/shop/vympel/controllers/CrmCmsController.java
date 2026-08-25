package com.shop.vympel.controllers;

import com.shop.vympel.dtos.cms.*;
import com.shop.vympel.services.cms.PublicCmsCacheInvalidationService;
import com.shop.vympel.services.cms.CmsService;
import com.shop.vympel.services.cms.CmsMediaCleanupService;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.crm.CrmAuditedMutationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/cms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CrmCmsController {
    private final CmsService cmsService;
    private final CrmActivityService crmActivityService;
    private final PublicCmsCacheInvalidationService publicCmsCacheInvalidationService;
    private final CmsMediaCleanupService cmsMediaCleanupService;
    private final CrmAuditedMutationService crmAuditedMutationService;

    @GetMapping("/pages")
    public List<CrmCmsPageSummaryResponse> getPages() {
        return cmsService.getCrmPages();
    }

    @GetMapping("/pages/{pageKey}")
    public CrmCmsPageResponse getPage(@PathVariable String pageKey) {
        return cmsService.getCrmPage(pageKey);
    }

    @PostMapping("/blocks")
    public CrmCmsBlockResponse createBlock(
            @RequestBody @Valid CmsBlockRequest request,
            HttpServletRequest servletRequest
    ) {
        CrmCmsBlockResponse block = crmAuditedMutationService.execute(
                () -> cmsService.createBlock(request),
                created -> crmActivityService.log(
                        "CMS_BLOCK_CREATED",
                        "CMS_BLOCK",
                        created.id(),
                        metadata("pageKey", created.pageKey(), "blockKey", created.blockKey()),
                        servletRequest
                )
        );
        return withPublicCacheRefresh(block);
    }

    @PatchMapping("/blocks/{blockId}")
    public CrmCmsBlockResponse updateBlock(
            @PathVariable Long blockId,
            @RequestBody @Valid CmsBlockRequest request,
            HttpServletRequest servletRequest
    ) {
        CrmCmsBlockResponse block = crmAuditedMutationService.execute(
                () -> cmsService.updateBlock(blockId, request),
                updated -> crmActivityService.log(
                        "CMS_BLOCK_UPDATED",
                        "CMS_BLOCK",
                        updated.id(),
                        metadata("pageKey", updated.pageKey(), "blockKey", updated.blockKey()),
                        servletRequest
                )
        );
        return withPublicCacheRefresh(block);
    }

    @DeleteMapping("/blocks/{blockId}")
    public CrmCmsBlockResponse deleteBlock(@PathVariable Long blockId, HttpServletRequest servletRequest) {
        CrmCmsBlockResponse block = crmAuditedMutationService.execute(
                () -> cmsService.deleteBlock(blockId),
                deleted -> crmActivityService.log(
                        "CMS_BLOCK_DELETED",
                        "CMS_BLOCK",
                        blockId,
                        metadata("pageKey", deleted.pageKey(), "blockKey", deleted.blockKey()),
                        servletRequest
                )
        );
        return withPublicCacheRefresh(block);
    }

    @PatchMapping("/blocks/{blockId}/reorder")
    public CrmCmsBlockResponse reorderBlock(
            @PathVariable Long blockId,
            @RequestBody @Valid CmsReorderRequest request,
            HttpServletRequest servletRequest
    ) {
        CrmCmsBlockResponse block = crmAuditedMutationService.execute(
                () -> cmsService.reorderBlock(blockId, request),
                reordered -> crmActivityService.log(
                        "CMS_BLOCK_REORDERED",
                        "CMS_BLOCK",
                        reordered.id(),
                        metadata("sortOrder", reordered.sortOrder()),
                        servletRequest
                )
        );
        return withPublicCacheRefresh(block);
    }

    @PatchMapping("/blocks/{blockId}/publish")
    public CrmCmsBlockResponse publishBlock(@PathVariable Long blockId, HttpServletRequest servletRequest) {
        CrmCmsBlockResponse block = crmAuditedMutationService.execute(
                () -> cmsService.publishBlock(blockId),
                published -> crmActivityService.log(
                        "CMS_BLOCK_PUBLISHED",
                        "CMS_BLOCK",
                        published.id(),
                        metadata("blockKey", published.blockKey()),
                        servletRequest
                )
        );
        return withPublicCacheRefresh(block);
    }

    @PatchMapping("/blocks/{blockId}/unpublish")
    public CrmCmsBlockResponse unpublishBlock(@PathVariable Long blockId, HttpServletRequest servletRequest) {
        CrmCmsBlockResponse block = crmAuditedMutationService.execute(
                () -> cmsService.unpublishBlock(blockId),
                unpublished -> crmActivityService.log(
                        "CMS_BLOCK_UNPUBLISHED",
                        "CMS_BLOCK",
                        unpublished.id(),
                        metadata("blockKey", unpublished.blockKey()),
                        servletRequest
                )
        );
        return withPublicCacheRefresh(block);
    }

    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.transaction.annotation.Transactional
    public CmsMediaResponse uploadMedia(
            @RequestPart("file") MultipartFile file,
            HttpServletRequest servletRequest
    ) throws IOException {
        CmsMediaResponse media = cmsService.uploadMedia(file);
        crmActivityService.log(
                "CMS_MEDIA_UPLOADED",
                "CMS_MEDIA",
                media.id(),
                metadata("filename", media.originalFilename(), "sizeBytes", media.sizeBytes()),
                servletRequest
        );
        return media;
    }

    @GetMapping("/media/orphans")
    public CmsMediaOrphanPageResponse getOrphanMedia(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return cmsMediaCleanupService.dryRun(page, size);
    }

    @GetMapping("/media/{mediaId}/references")
    public List<CmsMediaReferenceResponse> getMediaReferences(@PathVariable Long mediaId) {
        return cmsMediaCleanupService.references(mediaId);
    }

    @PostMapping("/media/orphans/cleanup")
    public CmsMediaCleanupResponse cleanupOrphanMedia(
            @RequestParam(defaultValue = "25") int batchSize,
            HttpServletRequest servletRequest
    ) {
        String requestId = servletRequest.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = java.util.UUID.randomUUID().toString();
        }
        CmsMediaCleanupResponse result = cmsMediaCleanupService.cleanup(batchSize, requestId);
        crmActivityService.log(
                "CMS_MEDIA_CLEANUP",
                "CMS_MEDIA",
                null,
                metadata(
                        "requestId", result.requestId(),
                        "processed", result.processed(),
                        "succeeded", result.succeeded(),
                        "failed", result.failed(),
                        "skipped", result.skipped()
                ),
                servletRequest
        );
        return result;
    }

    private Map<String, Object> metadata(Object... values) {
        Map<String, Object> metadata = new HashMap<>();
        for (int index = 0; index + 1 < values.length; index += 2) {
            metadata.put(String.valueOf(values[index]), values[index + 1]);
        }
        return metadata;
    }

    private CrmCmsBlockResponse withPublicCacheRefresh(CrmCmsBlockResponse block) {
        CmsPublicCacheRefreshResponse refresh = publicCmsCacheInvalidationService.refreshPage(block.pageKey());
        return block.withPublicCacheRefresh(refresh);
    }
}
