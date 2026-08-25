package com.shop.vympel.services.crm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CrmActivityRetentionJob {
    private final CrmActivityRetentionService retentionService;

    @Value("${app.crm.activity-retention.cleanup-enabled:true}")
    private boolean cleanupEnabled;

    @Scheduled(cron = "${app.crm.activity-retention.cleanup-cron:0 15 4 * * *}")
    public void cleanupExpiredActivity() {
        if (!cleanupEnabled) {
            return;
        }

        try {
            CrmActivityRetentionService.RetentionResult result = retentionService.runOnce();
            if (!result.lockAcquired()) {
                log.debug("CRM activity retention skipped because another instance owns the database lock");
                return;
            }
            log.info(
                    "CRM activity retention completed cutoff={} candidates={} deleted={} dryRun={}",
                    result.cutoff(),
                    result.candidates(),
                    result.deleted(),
                    result.dryRun()
            );
        } catch (RuntimeException exception) {
            log.error("CRM activity retention failed", exception);
        }
    }
}
