package com.shop.vympel.services.cms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@RequiredArgsConstructor
@Slf4j
public class CmsMediaCleanupJob {
    private final CmsMediaCleanupService cleanupService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Value("${app.cms.media-cleanup.scheduled-enabled:false}")
    private boolean scheduledEnabled;

    @Value("${app.cms.media-cleanup.batch-size:25}")
    private int batchSize;

    @Scheduled(cron = "${app.cms.media-cleanup.cron:0 30 3 * * *}")
    public void cleanupOrphans() {
        if (!scheduledEnabled || !running.compareAndSet(false, true)) {
            return;
        }
        try {
            cleanupService.cleanup(batchSize, "scheduled-" + UUID.randomUUID());
        } catch (RuntimeException ex) {
            log.error("Scheduled CMS media cleanup failed", ex);
        } finally {
            running.set(false);
        }
    }
}
