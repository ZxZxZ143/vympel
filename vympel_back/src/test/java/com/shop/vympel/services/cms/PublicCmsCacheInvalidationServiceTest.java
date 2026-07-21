package com.shop.vympel.services.cms;

import com.shop.vympel.dtos.cms.CmsPublicCacheRefreshResponse;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PublicCmsCacheInvalidationServiceTest {
    @Test
    void disabledRevalidationIsExplicitlyNotRequired() {
        CmsRevalidationOutboxService outbox = mock(CmsRevalidationOutboxService.class);
        when(outbox.isEnabled()).thenReturn(false);
        PublicCmsCacheInvalidationService service = new PublicCmsCacheInvalidationService(
                outbox,
                mock(CmsRevalidationJobStore.class),
                "",
                "",
                3000,
                8
        );

        CmsPublicCacheRefreshResponse result = service.refreshPage("home");

        assertEquals("NOT_REQUIRED", result.status());
        assertEquals(false, result.refreshed());
    }

    @Test
    void missingEnabledConfigurationIsPermanentAndObservable() {
        CmsRevalidationOutboxService outbox = mock(CmsRevalidationOutboxService.class);
        CmsRevalidationJobStore store = mock(CmsRevalidationJobStore.class);
        CmsRevalidationJobStore.Claim claim = new CmsRevalidationJobStore.Claim(1L, "home", "request-id", 1);
        when(outbox.isEnabled()).thenReturn(true);
        when(store.claim(eq("home"), any(Instant.class))).thenReturn(Optional.of(claim));
        PublicCmsCacheInvalidationService service = new PublicCmsCacheInvalidationService(
                outbox,
                store,
                "",
                "",
                3000,
                8
        );

        CmsPublicCacheRefreshResponse result = service.refreshPage("home");

        assertEquals("FAILED_NOT_CONFIGURED", result.status());
        verify(store).completePermanent(eq(claim), any(Instant.class), eq("NOT_CONFIGURED"));
    }

    @Test
    void temporaryNetworkFailureSchedulesBoundedRetry() {
        CmsRevalidationOutboxService outbox = mock(CmsRevalidationOutboxService.class);
        CmsRevalidationJobStore store = mock(CmsRevalidationJobStore.class);
        CmsRevalidationJobStore.Claim claim = new CmsRevalidationJobStore.Claim(
                1L,
                "catalog",
                "de305d54-75b4-431b-adb2-eb6b9e546014",
                1
        );
        when(outbox.isEnabled()).thenReturn(true);
        when(store.claim(eq("catalog"), any(Instant.class))).thenReturn(Optional.of(claim));
        PublicCmsCacheInvalidationService service = new PublicCmsCacheInvalidationService(
                outbox,
                store,
                "http://127.0.0.1:1/api/revalidate",
                "test-revalidation-secret-long-enough",
                250,
                8
        );

        CmsPublicCacheRefreshResponse result = service.refreshPage("catalog");

        assertEquals("FAILED_RETRY_SCHEDULED", result.status());
        verify(store).completeRetry(eq(claim), any(Instant.class), eq("REQUEST_FAILED"));
    }
}
