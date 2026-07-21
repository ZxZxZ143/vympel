package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository.PublicProductSummary;
import com.shop.vympel.dtos.product.ProductBatchSummaryItemResponse;
import com.shop.vympel.dtos.product.ProductBatchSummaryResponse;
import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.features.FeatureDto;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import lombok.RequiredArgsConstructor;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductBatchSummaryService {
    public static final int MAX_BATCH_SIZE = 60;

    private final PublicProductSummaryRepository summaryRepository;
    private final ObjectStorageService objectStorageService;
    private final MeterRegistry meterRegistry;

    @Transactional(readOnly = true)
    public ProductBatchSummaryResponse getSummaries(List<Long> requestedIds, Language language) {
        long started = System.nanoTime();
        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>(requestedIds);
        if (uniqueIds.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException("A product summary batch may contain at most " + MAX_BATCH_SIZE + " ids");
        }

        Map<Long, PublicProductSummary> summaries = summaryRepository.findAllByIds(uniqueIds, language.getValue())
                .stream()
                .collect(Collectors.toMap(PublicProductSummary::productId, Function.identity()));
        List<ProductBatchSummaryItemResponse> items = uniqueIds.stream()
                .map(summaries::get)
                .filter(java.util.Objects::nonNull)
                .map(this::toResponse)
                .toList();
        List<Long> missingIds = uniqueIds.stream()
                .filter(id -> !summaries.containsKey(id))
                .toList();
        ProductBatchSummaryResponse response = new ProductBatchSummaryResponse(items, missingIds);
        meterRegistry.summary("vympel.public.product_batch.size").record(uniqueIds.size());
        meterRegistry.summary("vympel.public.product_batch.queries").record(1);
        Timer.builder("vympel.public.product_batch.duration")
                .tag("size", sizeBucket(uniqueIds.size()))
                .register(meterRegistry)
                .record(System.nanoTime() - started, java.util.concurrent.TimeUnit.NANOSECONDS);
        return response;
    }

    private String sizeBucket(int size) {
        if (size <= 10) return "1_10";
        if (size <= 30) return "11_30";
        return "31_60";
    }

    private ProductBatchSummaryItemResponse toResponse(PublicProductSummary summary) {
        CollectionResponse collection = null;
        if (summary.collectionId() != null) {
            collection = new CollectionResponse();
            collection.setId(summary.collectionId());
            collection.setName(summary.collectionName());
        }
        FeatureDto brand = summary.brandId() == null ? null : new FeatureDto(summary.brandId(), summary.brandName());
        return new ProductBatchSummaryItemResponse(
                summary.productId(), summary.name(), summary.model(), summary.sku(),
                summary.price() == null ? null : summary.price().intValue(), summary.stockQuantity(),
                summary.status(), objectStorageService.getPublicLink(summary.imageKey()), summary.kaspiUrl(),
                summary.wildberriesUrl(), collection, brand, summary.categoryCode(), summary.categoryName(),
                summary.ratingAverage(), summary.ratingCount()
        );
    }
}
