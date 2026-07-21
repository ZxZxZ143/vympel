package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.dtos.cms.*;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;

@Service
@Slf4j
public class CmsMediaCleanupService {
    private static final EnumSet<CmsMediaLifecycleStatus> CANDIDATE_STATUSES =
            EnumSet.of(
                    CmsMediaLifecycleStatus.ACTIVE,
                    CmsMediaLifecycleStatus.DELETE_PENDING,
                    CmsMediaLifecycleStatus.DELETE_FAILED
            );

    private final CmsMediaRepository cmsMediaRepository;
    private final CmsMediaReferenceService referenceService;
    private final CmsMediaCleanupTransactionService transactionService;
    private final ObjectStorageService objectStorageService;
    private final Duration gracePeriod;
    private final int maxBatchSize;
    private final Duration staleClaimTimeout;

    public CmsMediaCleanupService(
            CmsMediaRepository cmsMediaRepository,
            CmsMediaReferenceService referenceService,
            CmsMediaCleanupTransactionService transactionService,
            ObjectStorageService objectStorageService,
            @Value("${app.cms.media-cleanup.grace-period:24h}") Duration gracePeriod,
            @Value("${app.cms.media-cleanup.max-batch-size:100}") int maxBatchSize,
            @Value("${app.cms.media-cleanup.stale-claim-timeout:15m}") Duration staleClaimTimeout
    ) {
        this.cmsMediaRepository = cmsMediaRepository;
        this.referenceService = referenceService;
        this.transactionService = transactionService;
        this.objectStorageService = objectStorageService;
        this.gracePeriod = gracePeriod;
        this.maxBatchSize = Math.max(1, maxBatchSize);
        this.staleClaimTimeout = staleClaimTimeout;
    }

    @Transactional(readOnly = true)
    public CmsMediaOrphanPageResponse dryRun(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(maxBatchSize, size));
        Instant now = Instant.now();
        Page<CmsMedia> candidates = cmsMediaRepository.findCleanupCandidates(
                CANDIDATE_STATUSES,
                now.minus(gracePeriod),
                now,
                now.minus(staleClaimTimeout),
                PageRequest.of(safePage, safeSize)
        );
        List<CmsMediaOrphanCandidateResponse> items = candidates.getContent()
                .stream()
                .map(media -> toCandidate(media, now))
                .toList();
        CmsMediaOrphanPageResponse response = new CmsMediaOrphanPageResponse(
                items,
                candidates.getNumber(),
                candidates.getSize(),
                candidates.getTotalElements(),
                candidates.getTotalPages()
        );
        log.info(
                "CMS media orphan dry-run page={} size={} totalCandidates={}",
                response.page(),
                response.size(),
                response.totalItems()
        );
        return response;
    }

    @Transactional(readOnly = true)
    public List<CmsMediaReferenceResponse> references(Long mediaId) {
        if (!cmsMediaRepository.existsById(mediaId)) {
            throw new ResourceNotFoundException("CMS media not found");
        }
        List<CmsMediaReferenceResponse> references = referenceService.findReferences(mediaId);
        log.info("CMS media reference inspection mediaId={} referenceCount={}", mediaId, references.size());
        return references;
    }

    public CmsMediaCleanupResponse cleanup(int requestedBatchSize, String requestId) {
        int batchSize = Math.max(1, Math.min(maxBatchSize, requestedBatchSize));
        Instant now = Instant.now();
        Pageable firstBatch = PageRequest.of(0, batchSize);
        List<Long> candidateIds = cmsMediaRepository.findCleanupCandidates(
                        CANDIDATE_STATUSES,
                        now.minus(gracePeriod),
                        now,
                        now.minus(staleClaimTimeout),
                        firstBatch
                )
                .stream()
                .map(CmsMedia::getId)
                .toList();

        int succeeded = 0;
        int failed = 0;
        int skipped = 0;
        for (Long mediaId : candidateIds) {
            CmsMediaCleanupTransactionService.ClaimResult claim = transactionService.claim(mediaId, Instant.now());
            if (!claim.claimed()) {
                skipped++;
                continue;
            }
            try {
                objectStorageService.delete(claim.objectKey());
                if (transactionService.completeSuccess(mediaId)) {
                    succeeded++;
                } else {
                    failed++;
                }
            } catch (RuntimeException ex) {
                failed++;
                transactionService.completeFailure(mediaId, Instant.now(), "STORAGE_DELETE_FAILED");
                log.warn("CMS media cleanup failed requestId={} mediaId={}", requestId, mediaId);
            }
        }

        CmsMediaCleanupResponse response = new CmsMediaCleanupResponse(
                requestId,
                candidateIds.size(),
                succeeded,
                failed,
                skipped
        );
        log.info(
                "CMS media cleanup completed requestId={} processed={} succeeded={} failed={} skipped={}",
                requestId,
                response.processed(),
                response.succeeded(),
                response.failed(),
                response.skipped()
        );
        return response;
    }

    private CmsMediaOrphanCandidateResponse toCandidate(CmsMedia media, Instant now) {
        Instant anchor = media.getOrphanedAt() == null ? media.getCreatedAt() : media.getOrphanedAt();
        return new CmsMediaOrphanCandidateResponse(
                media.getId(),
                media.getOriginalFilename(),
                media.getContentType(),
                media.getSizeBytes(),
                media.getCreatedAt(),
                media.getOrphanedAt(),
                anchor == null ? now : anchor.plus(gracePeriod),
                media.getLifecycleStatus(),
                media.getDeleteAttemptCount(),
                0
        );
    }
}
