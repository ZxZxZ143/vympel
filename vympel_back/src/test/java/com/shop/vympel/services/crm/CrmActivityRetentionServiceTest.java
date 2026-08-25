package com.shop.vympel.services.crm;

import com.shop.vympel.db.repositories.audit.CrmActivityRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CrmActivityRetentionServiceTest {
    @Test
    void deletesExpiredRowsInBoundedBatchesAndRecordsMetric() {
        CrmActivityRepository repository = mock(CrmActivityRepository.class);
        SimpleMeterRegistry metrics = new SimpleMeterRegistry();
        when(repository.tryAcquireRetentionLock()).thenReturn(true);
        when(repository.countExpired(any())).thenReturn(5L);
        when(repository.deleteExpiredBatch(any(), eq(2))).thenReturn(2, 2, 1);

        CrmActivityRetentionService service = new CrmActivityRetentionService(
                repository, metrics, 365, false, 2, 10
        );

        CrmActivityRetentionService.RetentionResult result = service.runOnce();

        assertThat(result.lockAcquired()).isTrue();
        assertThat(result.candidates()).isEqualTo(5);
        assertThat(result.deleted()).isEqualTo(5);
        verify(repository, times(3)).deleteExpiredBatch(any(), eq(2));
        assertThat(metrics.counter("crm_activity_retention_deleted_total").count()).isEqualTo(5);
    }

    @Test
    void dryRunCountsButDoesNotDelete() {
        CrmActivityRepository repository = mock(CrmActivityRepository.class);
        when(repository.tryAcquireRetentionLock()).thenReturn(true);
        when(repository.countExpired(any())).thenReturn(7L);
        CrmActivityRetentionService service = new CrmActivityRetentionService(
                repository, new SimpleMeterRegistry(), 30, true, 50, 2
        );

        CrmActivityRetentionService.RetentionResult result = service.runOnce();

        assertThat(result.dryRun()).isTrue();
        assertThat(result.deleted()).isZero();
        verify(repository, never()).deleteExpiredBatch(any(), anyInt());
    }

    @Test
    void doesNothingWhenAnotherInstanceOwnsLock() {
        CrmActivityRepository repository = mock(CrmActivityRepository.class);
        when(repository.tryAcquireRetentionLock()).thenReturn(false);
        CrmActivityRetentionService service = new CrmActivityRetentionService(
                repository, new SimpleMeterRegistry(), 30, false, 50, 2
        );

        CrmActivityRetentionService.RetentionResult result = service.runOnce();

        assertThat(result.lockAcquired()).isFalse();
        verify(repository, never()).countExpired(any());
    }
}
