package com.shop.vympel.services.product;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductAnalyticsRetentionJob {
    private final ProductAnalyticsRetentionService retentionService;

    @Value("${app.analytics.cleanup-enabled:true}")
    private boolean cleanupEnabled;

    @Scheduled(cron = "${app.analytics.cleanup-cron:0 45 3 * * *}")
    public void cleanupExpiredEvents() {
        if (!cleanupEnabled) {
            return;
        }

        try {
            ProductAnalyticsRetentionService.RetentionResult result = retentionService.runOnce();
            if (!result.lockAcquired()) {
                log.debug("Analytics retention skipped because another instance owns the database lock");
                return;
            }
            log.info(
                    "Analytics retention completed cutoff={} candidates={} deleted={} dryRun={}",
                    result.cutoff(),
                    result.candidates(),
                    result.deleted(),
                    result.dryRun()
            );
        } catch (RuntimeException exception) {
            log.error("Analytics retention failed", exception);
        }
    }
}
