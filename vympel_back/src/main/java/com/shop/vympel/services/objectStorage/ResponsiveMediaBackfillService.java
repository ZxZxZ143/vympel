package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.media.MediaKeyCandidate;
import com.shop.vympel.db.repositories.media.MediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.function.Predicate;

/**
 * Bounded, resumable conversion of legacy media in stable id order. Each row commits separately,
 * so a stopped run keeps every finished conversion and the next run resumes from {@code nextAfterId}.
 * Not transactional itself: one long transaction would hold locks across many encodings.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ResponsiveMediaBackfillService {
    public static final int MAX_LIMIT = 25;
    static final long TIME_BUDGET_NANOS = TimeUnit.SECONDS.toNanos(45);

    private final MediaRepository mediaRepository;
    private final CmsMediaRepository cmsMediaRepository;
    private final ResponsiveMediaConversionService conversionService;

    public record Batch(
            ResponsiveMediaArea area,
            boolean dryRun,
            long nextAfterId,
            boolean hasMore,
            List<ResponsiveMediaConversionResult> items
    ) {
        public Map<ResponsiveMediaConversionStatus, Integer> summary() {
            Map<ResponsiveMediaConversionStatus, Integer> summary = new EnumMap<>(ResponsiveMediaConversionStatus.class);
            items.forEach(item -> summary.merge(item.status(), 1, Integer::sum));
            return summary;
        }
    }

    public Batch run(ResponsiveMediaArea area, boolean dryRun, long afterId, int limit) {
        return run(area, dryRun, afterId, limit, candidate -> false);
    }

    /**
     * Scans at most {@code limit} rows after {@code afterId}. Rows matching {@code skip} are passed over
     * without work. Processing stops early once the time budget is spent, always after at least one row.
     */
    public Batch run(ResponsiveMediaArea area, boolean dryRun, long afterId, int limit,
                     Predicate<MediaKeyCandidate> skip) {
        if (area == null) throw new IllegalArgumentException("Media area is required");
        if (afterId < 0) throw new IllegalArgumentException("afterId must not be negative");
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new IllegalArgumentException("limit must be between 1 and " + MAX_LIMIT);
        }
        List<MediaKeyCandidate> candidates = area == ResponsiveMediaArea.PRODUCT
                ? mediaRepository.findResponsiveCandidates(afterId, PageRequest.of(0, limit))
                : cmsMediaRepository.findResponsiveCandidates(afterId, PageRequest.of(0, limit));
        long deadline = System.nanoTime() + TIME_BUDGET_NANOS;
        List<ResponsiveMediaConversionResult> items = new ArrayList<>();
        long nextAfterId = afterId;
        int scanned = 0;
        for (MediaKeyCandidate candidate : candidates) {
            if (scanned > 0 && System.nanoTime() >= deadline) break;
            scanned++;
            nextAfterId = candidate.id();
            if (skip.test(candidate)) continue;
            items.add(convertOne(area, candidate.id(), candidate.objectKey(), dryRun));
        }
        boolean hasMore = scanned < candidates.size() || candidates.size() == limit;
        log.info("Responsive media batch area={} dryRun={} scanned={} processed={} nextAfterId={} hasMore={}",
                area, dryRun, scanned, items.size(), nextAfterId, hasMore);
        return new Batch(area, dryRun, nextAfterId, hasMore, List.copyOf(items));
    }

    /** Never throws: unexpected failures are reported per row so one bad object cannot stop a batch. */
    public ResponsiveMediaConversionResult convertOne(ResponsiveMediaArea area, Long mediaId, String expectedKey,
                                                      boolean dryRun) {
        try {
            return area == ResponsiveMediaArea.PRODUCT
                    ? conversionService.convertProductMedia(mediaId, expectedKey, dryRun)
                    : conversionService.convertCmsMedia(mediaId, expectedKey, dryRun);
        } catch (ResponsiveFamilyConflictException exception) {
            log.warn("Responsive media conversion conflict area={} mediaId={}", area, mediaId);
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.CONFLICT);
        } catch (RuntimeException exception) {
            log.error("Responsive media conversion failed area={} mediaId={}", area, mediaId, exception);
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.FAILED,
                    exception.getClass().getSimpleName());
        }
    }
}
