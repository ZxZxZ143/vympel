package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CmsMediaLifecycleServiceTest {
    @Mock
    private CmsMediaRepository mediaRepository;
    @Mock
    private CmsMediaReferenceService referenceService;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock
    private TransactionStatus transactionStatus;

    private CmsMediaLifecycleService service;

    @BeforeEach
    void setUp() {
        when(transactionManager.getTransaction(org.mockito.ArgumentMatchers.any()))
                .thenReturn(transactionStatus);
        service = new CmsMediaLifecycleService(mediaRepository, referenceService, transactionManager);
    }

    @Test
    void detachedMediaIsUpdatedInARequiresNewTransactionAfterCommit() {
        CmsMedia media = new CmsMedia();
        media.setId(91L);
        media.setLifecycleStatus(CmsMediaLifecycleStatus.DELETE_FAILED);
        media.setDeleteRequestedAt(Instant.parse("2026-07-19T12:00:00Z"));
        media.setNextDeleteAttemptAt(Instant.parse("2026-07-19T12:05:00Z"));
        media.setLastDeleteErrorCode("STORAGE_DELETE_FAILED");
        when(mediaRepository.findByIdForUpdate(91L)).thenReturn(Optional.of(media));
        when(referenceService.isReferenced(91L)).thenReturn(false);

        service.afterReferencesChanged(new CmsMediaReferencesChangedEvent(Set.of(91L)));

        ArgumentCaptor<TransactionDefinition> definition = ArgumentCaptor.forClass(TransactionDefinition.class);
        verify(transactionManager).getTransaction(definition.capture());
        assertEquals(TransactionDefinition.PROPAGATION_REQUIRES_NEW,
                definition.getValue().getPropagationBehavior());
        verify(transactionManager).commit(transactionStatus);
        assertEquals(CmsMediaLifecycleStatus.ACTIVE, media.getLifecycleStatus());
        assertNull(media.getDeleteRequestedAt());
        assertNull(media.getNextDeleteAttemptAt());
        assertNull(media.getLastDeleteErrorCode());
    }
}
