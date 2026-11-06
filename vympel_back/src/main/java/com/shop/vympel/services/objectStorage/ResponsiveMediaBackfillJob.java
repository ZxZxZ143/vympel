package com.shop.vympel.services.objectStorage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Optional slow sweep over every legacy product/CMS image, disabled by default. Each tick converts a
 * small batch per area and resumes from an in-memory cursor; terminal outcomes (GIF, shared key, ...)
 * are remembered so a wrap-around does not download them again. Correctness never depends on this
 * process-local state: the locked per-row conversion is safe across replicas and restarts.
 */
@Component
@Slf4j
public class ResponsiveMediaBackfillJob {
    private static final int MAX_REMEMBERED = 10_000;

    private final ResponsiveMediaBackfillService backfillService;
    private final boolean enabled;
    private final int batchSize;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final Map<ResponsiveMediaArea, Long> cursors = new EnumMap<>(ResponsiveMediaArea.class);
    private final Set<String> terminal = ConcurrentHashMap.newKeySet();

    public ResponsiveMediaBackfillJob(
            ResponsiveMediaBackfillService backfillService,
            @Value("${app.image-variants.backfill.scheduled-enabled:false}") boolean enabled,
            @Value("${app.image-variants.backfill.batch-size:5}") int batchSize
    ) {
        this.backfillService = backfillService;
        this.enabled = enabled;
        this.batchSize = Math.max(1, Math.min(batchSize, ResponsiveMediaBackfillService.MAX_LIMIT));
    }

    @Scheduled(
            initialDelayString = "${app.image-variants.backfill.initial-delay-ms:120000}",
            fixedDelayString = "${app.image-variants.backfill.interval-ms:300000}"
    )
    public void sweep() {
        if (!enabled || !running.compareAndSet(false, true)) return;
        try {
            for (ResponsiveMediaArea area : ResponsiveMediaArea.values()) {
                sweep(area);
            }
        } catch (RuntimeException exception) {
            log.error("Scheduled responsive media backfill failed", exception);
        } finally {
            running.set(false);
        }
    }

    void sweep(ResponsiveMediaArea area) {
        long after = cursors.getOrDefault(area, 0L);
        var batch = backfillService.run(area, false, after, batchSize,
                candidate -> terminal.contains(memoryKey(area, candidate.id())));
        for (var item : batch.items()) {
            if (item.status().terminal() && terminal.size() < MAX_REMEMBERED) {
                terminal.add(memoryKey(area, item.mediaId()));
            }
        }
        cursors.put(area, batch.hasMore() ? batch.nextAfterId() : 0L);
    }

    private static String memoryKey(ResponsiveMediaArea area, Long mediaId) {
        return area + ":" + mediaId;
    }
}
