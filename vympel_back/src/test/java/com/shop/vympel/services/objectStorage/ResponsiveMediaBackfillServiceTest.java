package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.media.MediaKeyCandidate;
import com.shop.vympel.db.repositories.media.MediaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;
import java.util.concurrent.AbstractExecutorService;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResponsiveMediaBackfillServiceTest {
    @Mock
    private MediaRepository mediaRepository;
    @Mock
    private CmsMediaRepository cmsMediaRepository;
    @Mock
    private ResponsiveMediaConversionService conversionService;

    private ResponsiveMediaBackfillService service;

    @BeforeEach
    void setUp() {
        service = new ResponsiveMediaBackfillService(mediaRepository, cmsMediaRepository, conversionService);
    }

    @Test
    void convertsEachSelectedRowWithItsObservedKeyAndReportsWhereToResume() {
        when(mediaRepository.findResponsiveCandidates(3L, PageRequest.of(0, 2))).thenReturn(List.of(
                new MediaKeyCandidate(4L, "product/a.png"), new MediaKeyCandidate(9L, "product/b.png")));
        when(conversionService.convertProductMedia(4L, "product/a.png", false))
                .thenReturn(result(4L, ResponsiveMediaConversionStatus.CONVERTED));
        when(conversionService.convertProductMedia(9L, "product/b.png", false))
                .thenThrow(new ResponsiveFamilyConflictException("product/b-family"));

        var batch = service.run(ResponsiveMediaArea.PRODUCT, false, 3L, 2);

        assertEquals(9L, batch.nextAfterId());
        assertTrue(batch.hasMore(), "a full page may be followed by more rows");
        assertEquals(List.of(ResponsiveMediaConversionStatus.CONVERTED, ResponsiveMediaConversionStatus.CONFLICT),
                batch.items().stream().map(ResponsiveMediaConversionResult::status).toList());
        assertEquals(Map.of(ResponsiveMediaConversionStatus.CONVERTED, 1, ResponsiveMediaConversionStatus.CONFLICT, 1),
                batch.summary());
    }

    @Test
    void dryRunCmsBatchSkipsRememberedRowsAndReportsUnexpectedFailuresPerRow() {
        when(cmsMediaRepository.findResponsiveCandidates(0L, PageRequest.of(0, 5))).thenReturn(List.of(
                new MediaKeyCandidate(1L, "cms/a.png"), new MediaKeyCandidate(2L, "cms/b.png")));
        when(conversionService.convertCmsMedia(2L, "cms/b.png", true)).thenThrow(new IllegalStateException("s3 down"));

        var batch = service.run(ResponsiveMediaArea.CMS, true, 0L, 5, candidate -> candidate.id() == 1L);

        assertFalse(batch.hasMore());
        assertEquals(2L, batch.nextAfterId());
        assertEquals(1, batch.items().size());
        assertEquals(ResponsiveMediaConversionStatus.FAILED, batch.items().get(0).status());
        assertEquals("IllegalStateException", batch.items().get(0).reason());
        verify(conversionService, never()).convertCmsMedia(1L, "cms/a.png", true);
    }

    @Test
    void requestBoundsAreEnforcedBeforeAnyQuery() {
        assertThrows(IllegalArgumentException.class, () -> service.run(ResponsiveMediaArea.PRODUCT, true, 0L, 0));
        assertThrows(IllegalArgumentException.class, () -> service.run(ResponsiveMediaArea.PRODUCT, true, 0L, 26));
        assertThrows(IllegalArgumentException.class, () -> service.run(ResponsiveMediaArea.PRODUCT, true, -1L, 5));
        assertThrows(IllegalArgumentException.class, () -> service.run(null, true, 0L, 5));
        verify(mediaRepository, never()).findResponsiveCandidates(anyLong(), any());
    }

    @Test
    void deferredConverterRunsCommittedUploadsThroughTheSameConversionOnlyWhenEnabled() {
        var item = new ResponsiveMediaPendingEvent.Item(11L, "product/c.png");
        var event = new ResponsiveMediaPendingEvent(ResponsiveMediaArea.PRODUCT, List.of(item));
        when(conversionService.convertProductMedia(11L, "product/c.png", false))
                .thenReturn(result(11L, ResponsiveMediaConversionStatus.CONVERTED));

        new ResponsiveMediaDeferredConverter(service, true, new DirectExecutor(), false).onPending(event);
        verify(conversionService).convertProductMedia(11L, "product/c.png", false);

        new ResponsiveMediaDeferredConverter(service, false, new DirectExecutor(), false).onPending(event);
        verify(conversionService, org.mockito.Mockito.times(1)).convertProductMedia(anyLong(), anyString(), anyBoolean());
    }

    @Test
    void scheduledSweepIsOffByDefaultAndRemembersTerminalOutcomes() {
        new ResponsiveMediaBackfillJob(service, false, 5).sweep();
        verify(mediaRepository, never()).findResponsiveCandidates(anyLong(), any());

        var job = new ResponsiveMediaBackfillJob(service, true, 5);
        when(mediaRepository.findResponsiveCandidates(0L, PageRequest.of(0, 5)))
                .thenReturn(List.of(new MediaKeyCandidate(4L, "product/a.gif")));
        when(cmsMediaRepository.findResponsiveCandidates(0L, PageRequest.of(0, 5))).thenReturn(List.of());
        when(conversionService.convertProductMedia(4L, "product/a.gif", false))
                .thenReturn(result(4L, ResponsiveMediaConversionStatus.UNSUPPORTED_KEY));

        job.sweep();
        job.sweep();

        verify(conversionService, org.mockito.Mockito.times(1)).convertProductMedia(4L, "product/a.gif", false);
    }

    private ResponsiveMediaConversionResult result(Long id, ResponsiveMediaConversionStatus status) {
        return ResponsiveMediaConversionResult.of(ResponsiveMediaArea.PRODUCT, id, status);
    }

    private static final class DirectExecutor extends AbstractExecutorService {
        @Override
        public void execute(Runnable command) {
            command.run();
        }

        @Override
        public void shutdown() {
        }

        @Override
        public List<Runnable> shutdownNow() {
            return List.of();
        }

        @Override
        public boolean isShutdown() {
            return false;
        }

        @Override
        public boolean isTerminated() {
            return false;
        }

        @Override
        public boolean awaitTermination(long timeout, TimeUnit unit) {
            return true;
        }
    }
}
