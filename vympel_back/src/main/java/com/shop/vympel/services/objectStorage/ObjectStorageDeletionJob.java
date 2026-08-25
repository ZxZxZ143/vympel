package com.shop.vympel.services.objectStorage;

import com.shop.vympel.s3.StorageProps;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

@Component
@RequiredArgsConstructor
@Slf4j
public class ObjectStorageDeletionJob {
    private final ObjectStorageDeletionOutboxService outboxService;
    private final S3Client s3Client;
    private final StorageProps storageProps;
    private final MeterRegistry meterRegistry;

    @Value("${app.storage-deletion.enabled:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${app.storage-deletion.poll-interval:5000}")
    public void deleteQueuedObjects() {
        if (!enabled) {
            return;
        }
        for (ObjectStorageDeletionOutboxService.DeletionClaim claim : outboxService.claimDue()) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(storageProps.bucket())
                        .key(claim.objectKey())
                        .build());
                outboxService.complete(claim.id());
                meterRegistry.counter("object_storage_deletion_total", "outcome", "success").increment();
            } catch (RuntimeException exception) {
                log.warn("Object storage deletion will be retried objectKey={}", claim.objectKey(), exception);
                outboxService.retry(claim.id(), exception.getClass().getSimpleName());
                meterRegistry.counter("object_storage_deletion_total", "outcome", "retry").increment();
            }
        }
    }
}
