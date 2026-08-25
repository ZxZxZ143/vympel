package com.shop.vympel.services.crm;

import com.shop.vympel.db.repositories.audit.CrmActivityRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class CrmActivityRetentionService {
    private static final int MAX_CONFIGURED_BATCH_SIZE = 10_000;
    private static final int MAX_CONFIGURED_BATCHES = 100;

    private final CrmActivityRepository repository;
    private final MeterRegistry meterRegistry;
    private final int retentionDays;
    private final boolean dryRun;
    private final int batchSize;
    private final int maxBatches;

    public CrmActivityRetentionService(
            CrmActivityRepository repository,
            MeterRegistry meterRegistry,
            @Value("${app.crm.activity-retention.retention-days:365}") int retentionDays,
            @Value("${app.crm.activity-retention.cleanup-dry-run:false}") boolean dryRun,
            @Value("${app.crm.activity-retention.cleanup-batch-size:1000}") int batchSize,
            @Value("${app.crm.activity-retention.cleanup-max-batches:20}") int maxBatches
    ) {
        this.repository = repository;
        this.meterRegistry = meterRegistry;
        this.retentionDays = Math.max(1, retentionDays);
        this.dryRun = dryRun;
        this.batchSize = Math.max(1, Math.min(batchSize, MAX_CONFIGURED_BATCH_SIZE));
        this.maxBatches = Math.max(1, Math.min(maxBatches, MAX_CONFIGURED_BATCHES));
    }

    @Transactional
    public RetentionResult runOnce() {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        if (!repository.tryAcquireRetentionLock()) {
            return new RetentionResult(cutoff, 0, 0, dryRun, false);
        }

        long candidates = repository.countExpired(cutoff);
        if (dryRun || candidates == 0) {
            return new RetentionResult(cutoff, candidates, 0, dryRun, true);
        }

        long deleted = 0;
        for (int batch = 0; batch < maxBatches; batch++) {
            int batchDeleted = repository.deleteExpiredBatch(cutoff, batchSize);
            deleted += batchDeleted;
            if (batchDeleted < batchSize) {
                break;
            }
        }
        meterRegistry.counter("crm_activity_retention_deleted_total").increment(deleted);
        return new RetentionResult(cutoff, candidates, deleted, false, true);
    }

    public record RetentionResult(
            Instant cutoff,
            long candidates,
            long deleted,
            boolean dryRun,
            boolean lockAcquired
    ) {
    }
}
