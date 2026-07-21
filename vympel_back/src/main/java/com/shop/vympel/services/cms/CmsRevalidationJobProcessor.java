package com.shop.vympel.services.cms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@RequiredArgsConstructor
@Slf4j
public class CmsRevalidationJobProcessor {
    private final CmsRevalidationOutboxService outboxService;
    private final CmsRevalidationJobStore jobStore;
    private final PublicCmsCacheInvalidationService invalidationService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Value("${app.cms.public-revalidate.retry-batch-size:20}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${app.cms.public-revalidate.retry-poll-interval:5000}")
    public void processDueJobs() {
        if (!outboxService.isEnabled() || !running.compareAndSet(false, true)) {
            return;
        }
        try {
            for (String pageKey : jobStore.findDuePageKeys(Instant.now(), batchSize)) {
                invalidationService.refreshPage(pageKey);
            }
        } catch (RuntimeException ex) {
            log.error("CMS revalidation retry worker failed", ex);
        } finally {
            running.set(false);
        }
    }
}
