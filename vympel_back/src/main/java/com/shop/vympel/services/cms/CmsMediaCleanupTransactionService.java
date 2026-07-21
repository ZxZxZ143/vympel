package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import com.shop.vympel.enums.CmsMediaStorageType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@Slf4j
public class CmsMediaCleanupTransactionService {
    private final CmsMediaRepository cmsMediaRepository;
    private final CmsMediaReferenceService referenceService;
    private final Duration gracePeriod;
    private final Duration retryBaseDelay;
    private final Duration retryMaxDelay;
    private final Duration staleClaimTimeout;

    public CmsMediaCleanupTransactionService(
            CmsMediaRepository cmsMediaRepository,
            CmsMediaReferenceService referenceService,
            @Value("${app.cms.media-cleanup.grace-period:24h}") Duration gracePeriod,
            @Value("${app.cms.media-cleanup.retry-base-delay:5m}") Duration retryBaseDelay,
            @Value("${app.cms.media-cleanup.retry-max-delay:6h}") Duration retryMaxDelay,
            @Value("${app.cms.media-cleanup.stale-claim-timeout:15m}") Duration staleClaimTimeout
    ) {
        this.cmsMediaRepository = cmsMediaRepository;
        this.referenceService = referenceService;
        this.gracePeriod = gracePeriod;
        this.retryBaseDelay = retryBaseDelay;
        this.retryMaxDelay = retryMaxDelay;
        this.staleClaimTimeout = staleClaimTimeout;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ClaimResult claim(Long mediaId, Instant now) {
        CmsMedia media = cmsMediaRepository.findByIdForUpdate(mediaId).orElse(null);
        if (!isEligible(media, now)) {
            return ClaimResult.skipped();
        }
        if (referenceService.isReferenced(mediaId)) {
            restoreActive(media);
            return ClaimResult.skipped();
        }

        media.setLifecycleStatus(CmsMediaLifecycleStatus.DELETE_PENDING);
        media.setDeleteRequestedAt(now);
        media.setLastDeleteAttemptAt(now);
        media.setNextDeleteAttemptAt(null);
        media.setLastDeleteErrorCode(null);
        media.setDeleteAttemptCount(Math.min(1_000_000, media.getDeleteAttemptCount() + 1));
        cmsMediaRepository.saveAndFlush(media);
        return ClaimResult.claimed(media.getId(), media.getObjectKey());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean completeSuccess(Long mediaId) {
        CmsMedia media = cmsMediaRepository.findByIdForUpdate(mediaId).orElse(null);
        if (media == null) {
            return true;
        }
        if (referenceService.isReferenced(mediaId)) {
            media.setLifecycleStatus(CmsMediaLifecycleStatus.DELETE_FAILED);
            media.setCleanupProtected(true);
            media.setNextDeleteAttemptAt(null);
            media.setLastDeleteErrorCode("REFERENCE_AFTER_STORAGE_DELETE");
            log.error("CMS media cleanup found a new reference after storage deletion mediaId={}", mediaId);
            return false;
        }
        cmsMediaRepository.delete(media);
        cmsMediaRepository.flush();
        return true;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeFailure(Long mediaId, Instant now, String safeErrorCode) {
        CmsMedia media = cmsMediaRepository.findByIdForUpdate(mediaId).orElse(null);
        if (media == null) {
            return;
        }
        if (referenceService.isReferenced(mediaId)) {
            restoreActive(media);
            return;
        }

        media.setLifecycleStatus(CmsMediaLifecycleStatus.DELETE_FAILED);
        media.setLastDeleteErrorCode(safeErrorCode);
        media.setNextDeleteAttemptAt(now.plus(backoff(media.getDeleteAttemptCount())));
    }

    private boolean isEligible(CmsMedia media, Instant now) {
        if (media == null
                || media.getStorageType() != CmsMediaStorageType.OBJECT_STORAGE
                || Boolean.TRUE.equals(media.getCleanupProtected())
                || media.getObjectKey() == null
                || media.getObjectKey().isBlank()) {
            return false;
        }
        if (media.getLifecycleStatus() == CmsMediaLifecycleStatus.DELETE_PENDING
                && (media.getDeleteRequestedAt() == null
                    || media.getDeleteRequestedAt().plus(staleClaimTimeout).isAfter(now))) {
            return false;
        }
        if (media.getLifecycleStatus() == CmsMediaLifecycleStatus.DELETE_FAILED
                && media.getNextDeleteAttemptAt() != null
                && media.getNextDeleteAttemptAt().isAfter(now)) {
            return false;
        }
        Instant anchor = media.getOrphanedAt() == null ? media.getCreatedAt() : media.getOrphanedAt();
        return anchor != null && !anchor.plus(gracePeriod).isAfter(now);
    }

    private Duration backoff(int attemptCount) {
        int exponent = Math.max(0, Math.min(20, attemptCount - 1));
        long multiplier = 1L << exponent;
        try {
            Duration delay = retryBaseDelay.multipliedBy(multiplier);
            return delay.compareTo(retryMaxDelay) > 0 ? retryMaxDelay : delay;
        } catch (ArithmeticException ex) {
            return retryMaxDelay;
        }
    }

    private void restoreActive(CmsMedia media) {
        media.setLifecycleStatus(CmsMediaLifecycleStatus.ACTIVE);
        media.setOrphanedAt(null);
        media.setDeleteRequestedAt(null);
        media.setNextDeleteAttemptAt(null);
        media.setLastDeleteErrorCode(null);
    }

    public record ClaimResult(boolean claimed, Long mediaId, String objectKey) {
        static ClaimResult claimed(Long mediaId, String objectKey) {
            return new ClaimResult(true, mediaId, objectKey);
        }

        static ClaimResult skipped() {
            return new ClaimResult(false, null, null);
        }
    }
}
