package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import com.shop.vympel.enums.CmsMediaStorageType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CmsMediaCleanupTransactionServiceTest {
    @Mock
    private CmsMediaRepository mediaRepository;
    @Mock
    private CmsMediaReferenceService referenceService;

    private CmsMediaCleanupTransactionService service;

    @BeforeEach
    void setUp() {
        service = new CmsMediaCleanupTransactionService(
                mediaRepository,
                referenceService,
                Duration.ofHours(24),
                Duration.ofMinutes(5),
                Duration.ofHours(6),
                Duration.ofMinutes(15)
        );
    }

    @Test
    void referencedMediaIsNeverClaimedForDeletion() {
        Instant now = Instant.parse("2026-07-17T12:00:00Z");
        CmsMedia media = orphan(41L, now.minus(Duration.ofDays(2)));
        when(mediaRepository.findByIdForUpdate(41L)).thenReturn(Optional.of(media));
        when(referenceService.isReferenced(41L)).thenReturn(true);

        var result = service.claim(41L, now);

        assertFalse(result.claimed());
        assertEquals(CmsMediaLifecycleStatus.ACTIVE, media.getLifecycleStatus());
        verify(mediaRepository, never()).saveAndFlush(any());
    }

    @Test
    void freshUnattachedUploadIsProtectedByGracePeriod() {
        Instant now = Instant.parse("2026-07-17T12:00:00Z");
        CmsMedia media = orphan(42L, now.minus(Duration.ofHours(2)));
        when(mediaRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(media));

        var result = service.claim(42L, now);

        assertFalse(result.claimed());
        verify(referenceService, never()).isReferenced(anyLong());
    }

    @Test
    void eligibleOrphanIsClaimedAndStorageFailureBecomesRetryable() {
        Instant now = Instant.parse("2026-07-17T12:00:00Z");
        CmsMedia media = orphan(43L, now.minus(Duration.ofDays(2)));
        when(mediaRepository.findByIdForUpdate(43L)).thenReturn(Optional.of(media));
        when(referenceService.isReferenced(43L)).thenReturn(false);

        var result = service.claim(43L, now);
        service.completeFailure(43L, now, "STORAGE_DELETE_FAILED");

        assertTrue(result.claimed());
        assertEquals("cms/43.png", result.objectKey());
        assertEquals(CmsMediaLifecycleStatus.DELETE_FAILED, media.getLifecycleStatus());
        assertEquals(1, media.getDeleteAttemptCount());
        assertEquals(now.plus(Duration.ofMinutes(5)), media.getNextDeleteAttemptAt());
        assertEquals("STORAGE_DELETE_FAILED", media.getLastDeleteErrorCode());
    }

    @Test
    void successfulObjectDeletionRemovesOnlyStillUnreferencedRecord() {
        Instant now = Instant.parse("2026-07-17T12:00:00Z");
        CmsMedia media = orphan(44L, now.minus(Duration.ofDays(2)));
        media.setLifecycleStatus(CmsMediaLifecycleStatus.DELETE_PENDING);
        when(mediaRepository.findByIdForUpdate(44L)).thenReturn(Optional.of(media));
        when(referenceService.isReferenced(44L)).thenReturn(false);

        assertTrue(service.completeSuccess(44L));

        verify(mediaRepository).delete(media);
        verify(mediaRepository).flush();
    }

    @Test
    void referenceAppearingAfterStorageDeletionProtectsTheDatabaseRecordForRepair() {
        Instant now = Instant.parse("2026-07-17T12:00:00Z");
        CmsMedia media = orphan(46L, now.minus(Duration.ofDays(2)));
        media.setLifecycleStatus(CmsMediaLifecycleStatus.DELETE_PENDING);
        when(mediaRepository.findByIdForUpdate(46L)).thenReturn(Optional.of(media));
        when(referenceService.isReferenced(46L)).thenReturn(true);

        assertFalse(service.completeSuccess(46L));

        assertEquals(CmsMediaLifecycleStatus.DELETE_FAILED, media.getLifecycleStatus());
        assertTrue(media.getCleanupProtected());
        assertEquals("REFERENCE_AFTER_STORAGE_DELETE", media.getLastDeleteErrorCode());
        verify(mediaRepository, never()).delete(any());
    }

    @Test
    void stalePendingClaimIsRecoveredAfterProcessRestart() {
        Instant now = Instant.parse("2026-07-17T12:00:00Z");
        CmsMedia media = orphan(45L, now.minus(Duration.ofDays(2)));
        media.setLifecycleStatus(CmsMediaLifecycleStatus.DELETE_PENDING);
        media.setDeleteRequestedAt(now.minus(Duration.ofMinutes(16)));
        media.setDeleteAttemptCount(1);
        when(mediaRepository.findByIdForUpdate(45L)).thenReturn(Optional.of(media));
        when(referenceService.isReferenced(45L)).thenReturn(false);

        var result = service.claim(45L, now);

        assertTrue(result.claimed());
        assertEquals(2, media.getDeleteAttemptCount());
        assertEquals(now, media.getDeleteRequestedAt());
    }

    private CmsMedia orphan(Long id, Instant createdAt) {
        CmsMedia media = new CmsMedia();
        media.setId(id);
        media.setStorageType(CmsMediaStorageType.OBJECT_STORAGE);
        media.setObjectKey("cms/" + id + ".png");
        media.setCreatedAt(createdAt);
        media.setLifecycleStatus(CmsMediaLifecycleStatus.ACTIVE);
        media.setCleanupProtected(false);
        media.setDeleteAttemptCount(0);
        return media;
    }
}
