package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.analytics.ProductAnalyticsEventRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductAnalyticsRetentionServiceTest {
    @Test
    void dryRunCountsExpiredRowsWithoutDeleting() {
        ProductAnalyticsEventRepository repository = mock(ProductAnalyticsEventRepository.class);
        when(repository.tryAcquireRetentionLock()).thenReturn(true);
        when(repository.countExpired(any())).thenReturn(37L);
        ProductAnalyticsRetentionService service = new ProductAnalyticsRetentionService(
                repository, new SimpleMeterRegistry(), 180, true, 5000, 20
        );

        ProductAnalyticsRetentionService.RetentionResult result = service.runOnce();

        assertThat(result.candidates()).isEqualTo(37);
        assertThat(result.deleted()).isZero();
        assertThat(result.dryRun()).isTrue();
        verify(repository, never()).deleteExpiredBatch(any(), eq(5000));
    }

    @Test
    void lockPreventsConcurrentInstanceCleanup() {
        ProductAnalyticsEventRepository repository = mock(ProductAnalyticsEventRepository.class);
        when(repository.tryAcquireRetentionLock()).thenReturn(false);
        ProductAnalyticsRetentionService service = new ProductAnalyticsRetentionService(
                repository, new SimpleMeterRegistry(), 180, false, 100, 2
        );

        ProductAnalyticsRetentionService.RetentionResult result = service.runOnce();

        assertThat(result.lockAcquired()).isFalse();
        verify(repository, never()).countExpired(any());
        verify(repository, never()).deleteExpiredBatch(any(), eq(100));
    }

    @Test
    void deletionStopsAfterShortBatchAndReportsCount() {
        ProductAnalyticsEventRepository repository = mock(ProductAnalyticsEventRepository.class);
        when(repository.tryAcquireRetentionLock()).thenReturn(true);
        when(repository.countExpired(any())).thenReturn(150L);
        when(repository.deleteExpiredBatch(any(), eq(100))).thenReturn(100, 50);
        ProductAnalyticsRetentionService service = new ProductAnalyticsRetentionService(
                repository, new SimpleMeterRegistry(), 180, false, 100, 5
        );

        ProductAnalyticsRetentionService.RetentionResult result = service.runOnce();

        assertThat(result.deleted()).isEqualTo(150);
        verify(repository, org.mockito.Mockito.times(2)).deleteExpiredBatch(any(), eq(100));
    }
}
