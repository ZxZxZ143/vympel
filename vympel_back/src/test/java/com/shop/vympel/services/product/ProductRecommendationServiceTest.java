package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.product.ProductRecommendationRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository.PublicProductSummary;
import com.shop.vympel.db.repositories.product.ProductRecommendationRepository.RankedCandidate;
import com.shop.vympel.db.repositories.product.ProductRecommendationRepository.SourceProduct;
import com.shop.vympel.dtos.product.ProductRecommendationResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductRecommendationServiceTest {
    @Mock
    private ProductRecommendationRepository recommendationRepository;
    @Mock
    private PublicProductSummaryRepository summaryRepository;
    @Mock
    private ObjectStorageService objectStorageService;

    private ProductRecommendationService service;

    @BeforeEach
    void setUp() {
        service = new ProductRecommendationService(
                recommendationRepository,
                summaryRepository,
                objectStorageService,
                new SimpleMeterRegistry(),
                new BigDecimal("25")
        );
    }

    @Test
    void returnsStableDeduplicatedBoundedCardsWithThreeRepositoryCalls() {
        SourceProduct source = source(28L, 10L, 100L, null);
        List<RankedCandidate> ranked = new ArrayList<>();
        for (long id = 29; id <= 41; id++) {
            ranked.add(new RankedCandidate(id, 1));
        }
        ranked.add(new RankedCandidate(29L, 2));

        when(recommendationRepository.findSource(28L)).thenReturn(Optional.of(source));
        when(recommendationRepository.findRankedCandidateIds(
                eq(source), eq("ru"), any(BigDecimal.class), any(BigDecimal.class), eq(12)
        )).thenReturn(ranked);
        when(summaryRepository.findAllByIds(anyCollection(), eq("ru")))
                .thenAnswer(invocation -> invocation.<java.util.Collection<Long>>getArgument(0)
                        .stream()
                        .map(id -> card(id, "ACTIVE", 5, "products/" + id + ".jpg"))
                        .toList());
        when(objectStorageService.getPublicLink(any())).thenAnswer(invocation -> "public/" + invocation.getArgument(0));

        List<ProductRecommendationResponse> response = service.getRecommendations(28L, Language.RU, 99);

        assertThat(response).hasSize(12);
        assertThat(response).extracting(ProductRecommendationResponse::id)
                .containsExactlyElementsOf(java.util.stream.LongStream.rangeClosed(29, 40).boxed().toList());
        assertThat(response).extracting(ProductRecommendationResponse::imageUrl)
                .allMatch(url -> url.startsWith("public/products/"));
        verify(recommendationRepository, times(1)).findSource(28L);
        verify(recommendationRepository, times(1)).findRankedCandidateIds(
                eq(source), eq("ru"), any(BigDecimal.class), any(BigDecimal.class), eq(12)
        );
        verify(summaryRepository, times(1)).findAllByIds(anyCollection(), eq("ru"));
    }

    @Test
    void rareCategoryFallsThroughToGlobalCandidateAndKeepsLocale() {
        SourceProduct source = source(43L, 30L, 300L, 20L);
        when(recommendationRepository.findSource(43L)).thenReturn(Optional.of(source));
        when(recommendationRepository.findRankedCandidateIds(
                eq(source), eq("kk"), any(BigDecimal.class), any(BigDecimal.class), eq(12)
        )).thenReturn(List.of(new RankedCandidate(28L, 6)));
        when(summaryRepository.findAllByIds(anyCollection(), eq("kk")))
                .thenReturn(List.of(card(28L, "ACTIVE", 4, null)));

        List<ProductRecommendationResponse> response = service.getRecommendations(43L, Language.KZ, null);

        assertThat(response).singleElement().satisfies(item -> {
            assertThat(item.id()).isEqualTo(28L);
            assertThat(item.imageUrl()).isNull();
        });
        verify(objectStorageService).getPublicLink(null);
    }

    @Test
    void preservesInStockBeforeOutOfStockAndSupportsImageLessSource() {
        SourceProduct imageLessAccessorySource = source(45L, 40L, 400L, null);
        when(recommendationRepository.findSource(45L)).thenReturn(Optional.of(imageLessAccessorySource));
        when(recommendationRepository.findRankedCandidateIds(
                eq(imageLessAccessorySource), eq("en"), any(BigDecimal.class), any(BigDecimal.class), eq(2)
        )).thenReturn(List.of(
                new RankedCandidate(28L, 6),
                new RankedCandidate(44L, 7)
        ));
        when(summaryRepository.findAllByIds(anyCollection(), eq("en")))
                .thenReturn(List.of(
                        card(44L, "ACTIVE", 0, "products/44.jpg"),
                        card(28L, "ACTIVE", 3, "products/28.jpg")
                ));

        List<ProductRecommendationResponse> response = service.getRecommendations(45L, Language.EN, 2);

        assertThat(response).extracting(ProductRecommendationResponse::id).containsExactly(28L, 44L);
        assertThat(response).extracting(ProductRecommendationResponse::stockQuantity).containsExactly(3, 0);
    }

    @Test
    void excludesCurrentDuplicateAndDefensivelyDropsInactiveHydratedCards() {
        SourceProduct source = source(44L, 50L, 500L, null);
        when(recommendationRepository.findSource(44L)).thenReturn(Optional.of(source));
        when(recommendationRepository.findRankedCandidateIds(
                eq(source), eq("ru"), any(BigDecimal.class), any(BigDecimal.class), eq(12)
        )).thenReturn(List.of(
                new RankedCandidate(44L, 1),
                new RankedCandidate(28L, 6),
                new RankedCandidate(28L, 6),
                new RankedCandidate(43L, 6)
        ));
        when(summaryRepository.findAllByIds(anyCollection(), eq("ru")))
                .thenReturn(List.of(
                        card(28L, "ACTIVE", 2, null),
                        card(43L, "ARCHIVED", 2, null)
                ));

        List<ProductRecommendationResponse> response = service.getRecommendations(44L, Language.RU, 12);

        assertThat(response).extracting(ProductRecommendationResponse::id).containsExactly(28L);
    }

    @Test
    void singlePublicProductCatalogReturnsEmptyWithoutHydrationQuery() {
        SourceProduct source = source(45L, 40L, 400L, null);
        when(recommendationRepository.findSource(45L)).thenReturn(Optional.of(source));
        when(recommendationRepository.findRankedCandidateIds(
                eq(source), eq("ru"), any(BigDecimal.class), any(BigDecimal.class), eq(12)
        )).thenReturn(List.of());

        assertThat(service.getRecommendations(45L, Language.RU, 12)).isEmpty();
        verify(summaryRepository, never()).findAllByIds(anyCollection(), any());
    }

    @Test
    void timeoutOrInternalFailureReturnsEmptyInsteadOfEscapingToCustomer() {
        when(recommendationRepository.findSource(28L)).thenThrow(new RuntimeException("query timed out"));

        assertThat(service.getRecommendations(28L, Language.RU, 12)).isEmpty();
        verify(recommendationRepository, never()).findRankedCandidateIds(any(), any(), any(), any(), anyInt());
        verify(summaryRepository, never()).findAllByIds(anyCollection(), any());
    }

    @Test
    void appliesConfiguredPriceBandToRankedQuery() {
        SourceProduct source = source(28L, 10L, 100L, null);
        when(recommendationRepository.findSource(28L)).thenReturn(Optional.of(source));
        when(recommendationRepository.findRankedCandidateIds(
                eq(source), eq("ru"), any(BigDecimal.class), any(BigDecimal.class), eq(12)
        )).thenReturn(List.of());

        service.getRecommendations(28L, Language.RU, 12);

        ArgumentCaptor<BigDecimal> lower = ArgumentCaptor.forClass(BigDecimal.class);
        ArgumentCaptor<BigDecimal> upper = ArgumentCaptor.forClass(BigDecimal.class);
        verify(recommendationRepository).findRankedCandidateIds(
                eq(source), eq("ru"), lower.capture(), upper.capture(), eq(12)
        );
        assertThat(lower.getValue()).isEqualByComparingTo("75.00");
        assertThat(upper.getValue()).isEqualByComparingTo("125.00");
    }

    private SourceProduct source(Long productId, Long brandId, Long categoryId, Long parentCategoryId) {
        return new SourceProduct(productId, brandId, new BigDecimal("100.00"), categoryId, parentCategoryId);
    }

    private PublicProductSummary card(Long productId, String status, int stock, String imageKey) {
        return new PublicProductSummary(
                productId,
                "Product " + productId,
                "MODEL-" + productId,
                "SKU-" + productId,
                new BigDecimal("1000.00"),
                stock,
                status,
                imageKey,
                null,
                null,
                1L,
                "Collection",
                2L,
                "Brand",
                "WATCH",
                "Watches",
                4.5,
                10L
        );
    }
}
