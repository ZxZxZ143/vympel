package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.entity.storage.ObjectStorageDeletionJob;
import com.shop.vympel.db.repositories.storage.ObjectStorageDeletionJobRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class ObjectStorageDeletionOutboxService {
    private static final int MAX_BATCH_SIZE = 100;

    private final ObjectStorageDeletionJobRepository repository;
    private final int batchSize;
    private final Duration staleClaimTimeout;

    public ObjectStorageDeletionOutboxService(
            ObjectStorageDeletionJobRepository repository,
            @Value("${app.storage-deletion.batch-size:20}") int batchSize,
            @Value("${app.storage-deletion.stale-claim-timeout:5m}") Duration staleClaimTimeout
    ) {
        this.repository = repository;
        this.batchSize = Math.max(1, Math.min(batchSize, MAX_BATCH_SIZE));
        this.staleClaimTimeout = staleClaimTimeout.isNegative() || staleClaimTimeout.isZero()
                ? Duration.ofMinutes(5)
                : staleClaimTimeout;
    }

    @Transactional
    public void enqueue(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            throw new IllegalArgumentException("Object key is required");
        }
        repository.enqueue(objectKey);
    }

    @Transactional
    public List<DeletionClaim> claimDue() {
        Instant now = Instant.now();
        repository.releaseStaleClaims(now.minus(staleClaimTimeout));
        List<ObjectStorageDeletionJob> jobs = repository.findDueForUpdate(now, batchSize);
        jobs.forEach(job -> {
            job.setStatus("PROCESSING");
            job.setUpdatedAt(now);
        });
        repository.flush();
        return jobs.stream().map(job -> new DeletionClaim(job.getId(), job.getObjectKey())).toList();
    }

    @Transactional
    public void complete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public void retry(Long id, String error) {
        repository.findByIdForUpdate(id).ifPresent(job -> {
            int attempts = job.getAttemptCount() + 1;
            long delaySeconds = Math.min(300L, 1L << Math.min(attempts, 8));
            job.setAttemptCount(attempts);
            job.setStatus("PENDING");
            job.setNextAttemptAt(Instant.now().plusSeconds(delaySeconds));
            job.setLastError(limit(error, 255));
            job.setUpdatedAt(Instant.now());
        });
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    public record DeletionClaim(Long id, String objectKey) {
    }
}
