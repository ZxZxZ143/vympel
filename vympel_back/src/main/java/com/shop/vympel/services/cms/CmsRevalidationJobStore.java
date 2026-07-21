package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsRevalidationJob;
import com.shop.vympel.db.repositories.cms.CmsRevalidationJobRepository;
import com.shop.vympel.enums.CmsRevalidationJobStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

@Service
public class CmsRevalidationJobStore {
    private static final EnumSet<CmsRevalidationJobStatus> DUE_STATUSES =
            EnumSet.of(CmsRevalidationJobStatus.PENDING, CmsRevalidationJobStatus.RETRY);

    private final CmsRevalidationJobRepository repository;
    private final Duration staleClaimTimeout;
    private final Duration retryBaseDelay;
    private final Duration retryMaxDelay;

    public CmsRevalidationJobStore(
            CmsRevalidationJobRepository repository,
            @Value("${app.cms.public-revalidate.stale-claim-timeout:2m}") Duration staleClaimTimeout,
            @Value("${app.cms.public-revalidate.retry-base-delay:5s}") Duration retryBaseDelay,
            @Value("${app.cms.public-revalidate.retry-max-delay:5m}") Duration retryMaxDelay
    ) {
        this.repository = repository;
        this.staleClaimTimeout = staleClaimTimeout;
        this.retryBaseDelay = retryBaseDelay;
        this.retryMaxDelay = retryMaxDelay;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<Claim> claim(String pageKey, Instant now) {
        CmsRevalidationJob job = repository.findByPageKeyForUpdate(pageKey).orElse(null);
        if (job == null || !isDue(job, now)) {
            return Optional.empty();
        }
        job.setStatus(CmsRevalidationJobStatus.PROCESSING);
        job.setLockedAt(now);
        job.setLastAttemptAt(now);
        job.setAttemptCount(Math.min(1_000_000, job.getAttemptCount() + 1));
        repository.saveAndFlush(job);
        return Optional.of(new Claim(job.getId(), job.getPageKey(), job.getRequestId(), job.getAttemptCount()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeSuccess(Claim claim, Instant now) {
        updateIfCurrent(claim, job -> {
            job.setStatus(CmsRevalidationJobStatus.SUCCEEDED);
            job.setCompletedAt(now);
            job.setLockedAt(null);
            job.setLastErrorCode(null);
            job.setNextAttemptAt(now);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeRetry(Claim claim, Instant now, String errorCode) {
        updateIfCurrent(claim, job -> {
            job.setStatus(CmsRevalidationJobStatus.RETRY);
            job.setLockedAt(null);
            job.setLastErrorCode(errorCode);
            job.setNextAttemptAt(now.plus(backoff(job.getAttemptCount())));
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completePermanent(Claim claim, Instant now, String errorCode) {
        updateIfCurrent(claim, job -> {
            job.setStatus(CmsRevalidationJobStatus.FAILED_PERMANENT);
            job.setCompletedAt(now);
            job.setLockedAt(null);
            job.setLastErrorCode(errorCode);
            job.setNextAttemptAt(now);
        });
    }

    @Transactional(readOnly = true)
    public List<String> findDuePageKeys(Instant now, int batchSize) {
        return repository.findDuePageKeys(
                DUE_STATUSES,
                now,
                now.minus(staleClaimTimeout),
                PageRequest.of(0, Math.max(1, batchSize))
        );
    }

    private boolean isDue(CmsRevalidationJob job, Instant now) {
        if (DUE_STATUSES.contains(job.getStatus())) {
            return job.getNextAttemptAt() == null || !job.getNextAttemptAt().isAfter(now);
        }
        return job.getStatus() == CmsRevalidationJobStatus.PROCESSING
                && job.getLockedAt() != null
                && !job.getLockedAt().plus(staleClaimTimeout).isAfter(now);
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

    private void updateIfCurrent(Claim claim, java.util.function.Consumer<CmsRevalidationJob> update) {
        CmsRevalidationJob job = repository.findByPageKeyForUpdate(claim.pageKey()).orElse(null);
        if (job == null || !claim.requestId().equals(job.getRequestId())) {
            return;
        }
        update.accept(job);
    }

    public record Claim(Long id, String pageKey, String requestId, int attemptCount) {
    }
}
