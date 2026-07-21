package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.product.ProductRecommendationRepository;
import com.shop.vympel.db.repositories.product.ProductRecommendationRepository.RankedCandidate;
import com.shop.vympel.db.repositories.product.ProductRecommendationRepository.SourceProduct;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository.PublicProductSummary;
import com.shop.vympel.dtos.product.ProductRecommendationResponse;
import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ProductRecommendationService {
    public static final int DEFAULT_LIMIT = 12;
    public static final int MAX_LIMIT = 12;

    private final ProductRecommendationRepository recommendationRepository;
    private final PublicProductSummaryRepository summaryRepository;
    private final ObjectStorageService objectStorageService;
    private final BigDecimal priceBandPercent;
    private final MeterRegistry meterRegistry;
    @Value("${app.performance.slow-operation-threshold-ms:500}")
    private long slowOperationThresholdMs = 500;

    public ProductRecommendationService(
            ProductRecommendationRepository recommendationRepository,
            PublicProductSummaryRepository summaryRepository,
            ObjectStorageService objectStorageService,
            MeterRegistry meterRegistry,
            @Value("${app.recommendations.price-band-percent:25}") BigDecimal priceBandPercent
    ) {
        this.recommendationRepository = recommendationRepository;
        this.summaryRepository = summaryRepository;
        this.objectStorageService = objectStorageService;
        this.meterRegistry = meterRegistry;
        this.priceBandPercent = priceBandPercent;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<ProductRecommendationResponse> getRecommendations(Long productId, Language language, Integer requestedLimit) {
        int limit = boundedLimit(requestedLimit);
        long started = System.nanoTime();
        Timer.Sample sample = Timer.start(meterRegistry);
        int queryCount = 0;
        String outcome = "success";
        String stage = "none";

        try {
            queryCount++;
            SourceProduct source = recommendationRepository.findSource(productId).orElse(null);
            if (source == null) {
                log.debug("Recommendation source not found productId={}", productId);
                outcome = "source_missing";
                return List.of();
            }

            BigDecimal bandRatio = priceBandPercent
                    .max(BigDecimal.ZERO)
                    .min(new BigDecimal("100"))
                    .movePointLeft(2);
            BigDecimal sourcePrice = source.price() == null ? BigDecimal.ZERO : source.price();
            BigDecimal priceLower = sourcePrice
                    .multiply(BigDecimal.ONE.subtract(bandRatio))
                    .max(BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal priceUpper = sourcePrice
                    .multiply(BigDecimal.ONE.add(bandRatio))
                    .setScale(2, RoundingMode.HALF_UP);

            queryCount++;
            List<RankedCandidate> rankedCandidates = recommendationRepository.findRankedCandidateIds(
                    source,
                    language.getValue(),
                    priceLower,
                    priceUpper,
                    limit
            );

            LinkedHashSet<Long> orderedIds = rankedCandidates.stream()
                    .map(RankedCandidate::productId)
                    .filter(candidateId -> !productId.equals(candidateId))
                    .collect(Collectors.toCollection(LinkedHashSet::new));

            if (orderedIds.isEmpty()) {
                outcome = "empty";
                return List.of();
            }

            queryCount++;
            Map<Long, PublicProductSummary> cardsById = summaryRepository
                    .findAllByIds(orderedIds, language.getValue())
                    .stream()
                    .filter(card -> "ACTIVE".equals(card.status()))
                    .collect(Collectors.toMap(
                            PublicProductSummary::productId,
                            Function.identity(),
                            (first, ignored) -> first
                    ));

            List<ProductRecommendationResponse> recommendations = orderedIds.stream()
                    .map(cardsById::get)
                    .filter(java.util.Objects::nonNull)
                    .map(this::toResponse)
                    .limit(limit)
                    .toList();

            if (log.isDebugEnabled()) {
                String stages = rankedCandidates.stream()
                        .limit(recommendations.size())
                        .map(candidate -> Integer.toString(candidate.stage()))
                        .collect(Collectors.joining(","));
                log.debug(
                        "Recommendations resolved productId={} locale={} count={} stages={}",
                        productId,
                        language.getValue(),
                        recommendations.size(),
                        stages
                );
            }

            stage = rankedCandidates.isEmpty()
                    ? "none"
                    : Integer.toString(Math.max(1, Math.min(7, rankedCandidates.get(0).stage())));

            return recommendations;
        } catch (RuntimeException exception) {
            outcome = "error";
            log.error(
                    "Recommendation lookup failed productId={} locale={} limit={}",
                    productId,
                    language.getValue(),
                    limit,
                    exception
            );
            return List.of();
        } finally {
            meterRegistry.summary("vympel.public.recommendation.queries").record(queryCount);
            sample.stop(Timer.builder("vympel.public.recommendation.duration")
                    .tag("outcome", outcome)
                    .tag("stage", stage)
                    .register(meterRegistry));
            long durationMs = java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
            if (durationMs >= slowOperationThresholdMs) {
                log.warn("Slow recommendation lookup productId={} locale={} durationMs={} queryCount={} outcome={} stage={}",
                        productId, language.getValue(), durationMs, queryCount, outcome, stage);
            }
        }
    }

    private ProductRecommendationResponse toResponse(PublicProductSummary card) {
        CollectionResponse collection = null;
        if (card.collectionId() != null) {
            collection = new CollectionResponse();
            collection.setId(card.collectionId());
            collection.setName(card.collectionName());
        }

        return new ProductRecommendationResponse(
                card.productId(),
                card.name(),
                card.model(),
                card.price() == null ? null : card.price().intValue(),
                card.stockQuantity(),
                card.status(),
                objectStorageService.getPublicLink(card.imageKey()),
                card.kaspiUrl(),
                card.wildberriesUrl(),
                collection,
                card.ratingAverage(),
                card.ratingCount()
        );
    }

    private int boundedLimit(Integer requestedLimit) {
        if (requestedLimit == null) {
            return DEFAULT_LIMIT;
        }
        return Math.max(1, Math.min(requestedLimit, MAX_LIMIT));
    }
}
