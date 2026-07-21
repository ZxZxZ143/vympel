package com.shop.vympel.services.cms;

import com.shop.vympel.db.repositories.cms.CmsRevalidationJobRepository;
import com.shop.vympel.enums.CmsRevalidationJobStatus;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class CmsRevalidationQueueMetrics {
    public CmsRevalidationQueueMetrics(
            CmsRevalidationJobRepository repository,
            MeterRegistry meterRegistry
    ) {
        for (CmsRevalidationJobStatus status : CmsRevalidationJobStatus.values()) {
            Gauge.builder("cms_revalidation_queue_jobs", repository,
                            source -> source.countByStatus(status))
                    .description("Current CMS revalidation jobs by status")
                    .tag("status", status.name().toLowerCase())
                    .register(meterRegistry);
        }
    }
}
