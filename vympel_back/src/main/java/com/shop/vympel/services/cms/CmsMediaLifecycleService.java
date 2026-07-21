package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;

@Service
@Slf4j
public class CmsMediaLifecycleService {
    private final CmsMediaRepository cmsMediaRepository;
    private final CmsMediaReferenceService referenceService;
    private final TransactionTemplate transactionTemplate;

    public CmsMediaLifecycleService(
            CmsMediaRepository cmsMediaRepository,
            CmsMediaReferenceService referenceService,
            PlatformTransactionManager transactionManager
    ) {
        this.cmsMediaRepository = cmsMediaRepository;
        this.referenceService = referenceService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterReferencesChanged(CmsMediaReferencesChangedEvent event) {
        for (Long mediaId : event.detachedMediaIds()) {
            transactionTemplate.executeWithoutResult(ignored -> markDetachedIfUnreferenced(mediaId));
        }
    }

    private void markDetachedIfUnreferenced(Long mediaId) {
        CmsMedia media = cmsMediaRepository.findByIdForUpdate(mediaId).orElse(null);
        if (media == null || referenceService.isReferenced(mediaId)) {
            return;
        }
        if (media.getLifecycleStatus() == CmsMediaLifecycleStatus.DELETE_PENDING) {
            return;
        }

        media.setLifecycleStatus(CmsMediaLifecycleStatus.ACTIVE);
        media.setOrphanedAt(Instant.now());
        media.setDeleteRequestedAt(null);
        media.setNextDeleteAttemptAt(null);
        media.setLastDeleteErrorCode(null);
        log.info("CMS media detached and marked orphan candidate mediaId={}", mediaId);
    }
}
