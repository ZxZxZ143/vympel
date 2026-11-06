package com.shop.vympel.services.objectStorage;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * Builds the family for an upload that kept only its original because the request-time encoder was
 * busy or out of time. Runs on one background thread after the upload commits, through the same
 * locked, create-only conversion as the backfill. A full queue or a restart only delays the work:
 * the row stays a valid legacy reference that the backfill can convert later.
 */
@Component
@Slf4j
public class ResponsiveMediaDeferredConverter {
    private static final int QUEUE_CAPACITY = 200;

    private final ResponsiveMediaBackfillService backfillService;
    private final boolean enabled;
    private final ExecutorService executor;
    private final boolean ownsExecutor;

    @Autowired
    public ResponsiveMediaDeferredConverter(
            ResponsiveMediaBackfillService backfillService,
            @Value("${app.image-variants.deferred-enabled:true}") boolean enabled
    ) {
        this(backfillService, enabled, new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(QUEUE_CAPACITY), runnable -> {
                    Thread thread = new Thread(runnable, "responsive-media-deferred");
                    thread.setDaemon(true);
                    return thread;
                }), true);
    }

    ResponsiveMediaDeferredConverter(ResponsiveMediaBackfillService backfillService, boolean enabled,
                                     ExecutorService executor, boolean ownsExecutor) {
        this.backfillService = backfillService;
        this.enabled = enabled;
        this.executor = executor;
        this.ownsExecutor = ownsExecutor;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPending(ResponsiveMediaPendingEvent event) {
        if (!enabled) return;
        for (var item : event.items()) {
            try {
                executor.execute(() -> convert(event.area(), item));
            } catch (RejectedExecutionException exception) {
                log.warn("Deferred responsive conversion not queued area={} mediaId={} reason=queue_full",
                        event.area(), item.mediaId());
            }
        }
    }

    private void convert(ResponsiveMediaArea area, ResponsiveMediaPendingEvent.Item item) {
        var result = backfillService.convertOne(area, item.mediaId(), item.objectKey(), false);
        log.info("Deferred responsive conversion area={} mediaId={} status={}",
                area, item.mediaId(), result.status());
    }

    @PreDestroy
    void shutdown() {
        if (ownsExecutor) executor.shutdownNow();
    }
}
