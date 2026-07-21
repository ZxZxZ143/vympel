package com.shop.vympel.services.auth;

import com.shop.vympel.security.session.CrmSessionProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class RefreshSessionCleanupJob {
    private final CrmSessionService sessionService;
    private final CrmSessionProperties sessionProperties;

    @Scheduled(cron = "${security.crm-session.cleanup-cron:0 15 3 * * *}")
    public void cleanRetiredSessions() {
        Instant cutoff = Instant.now().minus(sessionProperties.getCleanupRetentionDays(), ChronoUnit.DAYS);
        int deleted = sessionService.deleteRetiredBefore(cutoff);
        if (deleted > 0) {
            log.info("Deleted retired refresh sessions count={}", deleted);
        }
    }
}
