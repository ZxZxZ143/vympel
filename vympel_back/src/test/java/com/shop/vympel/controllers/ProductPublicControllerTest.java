package com.shop.vympel.controllers;

import com.shop.vympel.dtos.catalog.CatalogProductQuery;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.product.ProductRecommendationResponse;
import com.shop.vympel.dtos.product.ProductBatchSummaryRequest;
import com.shop.vympel.dtos.review.PublicProductReviewResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.InvalidSortException;
import com.shop.vympel.services.catalog.ProductCatalogService;
import com.shop.vympel.services.product.ProductService;
import com.shop.vympel.services.product.ProductRecommendationService;
import com.shop.vympel.services.product.ProductBatchSummaryService;
import com.shop.vympel.services.review.ProductReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductPublicControllerTest {
    @Mock
    private ProductService productService;
    @Mock
    private ProductCatalogService productCatalogService;
    @Mock
    private ProductReviewService productReviewService;
    @Mock
    private ProductRecommendationService productRecommendationService;
    @Mock
    private ProductBatchSummaryService productBatchSummaryService;

    private ProductPublicController controller;

    @BeforeEach
    void setUp() {
        controller = new ProductPublicController(
                productService,
                productCatalogService,
                productReviewService,
                productRecommendationService,
                productBatchSummaryService,
                org.mockito.Mockito.mock(com.shop.vympel.security.ratelimit.AbuseProtectionService.class)
        );
    }

    @Test
    void catalogQueryIgnoresEmptyValuesAndRemovedCountryAliases() {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("categoryCode", " watch-wrist ");
        params.add("search", "   ");
        params.add("minPrice", "100");
        params.add("maxPrice", "500");
        params.add("brand", "null");
        params.add("mechanism", "1,2");
        params.add("mechanism", "[]");
        params.add("country", "3");
        params.add("country", "");
        params.add("brandCountry", "999");
        params.add("manufacturerCountry", "998");
        params.add("countryOfBrand", "997");
        params.add("unused", "undefined");

        when(productCatalogService.getProducts(any(), any(), eq(Language.RU)))
                .thenReturn(new PageImpl<ProductShortResponse>(List.of()));

        controller.getCatalogProducts(Language.RU, params, PageRequest.of(0, 9));

        ArgumentCaptor<CatalogProductQuery> queryCaptor = ArgumentCaptor.forClass(CatalogProductQuery.class);
        verify(productCatalogService).getProducts(queryCaptor.capture(), any(Pageable.class), eq(Language.RU));

        CatalogProductQuery query = queryCaptor.getValue();
        assertThat(query.getCategoryCode()).isEqualTo("watch-wrist");
        assertThat(query.getSearch()).isNull();
        assertThat(query.getPriceMin()).isEqualByComparingTo(new BigDecimal("100"));
        assertThat(query.getPriceMax()).isEqualByComparingTo(new BigDecimal("500"));
        assertThat(query.getFilters())
                .containsEntry("mechanism", List.of("1", "2"))
                .containsEntry("country", List.of("3"))
                .doesNotContainKeys("brand", "brandCountry", "manufacturerCountry", "countryOfBrand", "unused");
    }

    @Test
    void batchSummaryRejectsDeclaredBodyAboveEndpointLimitBeforeServiceWork() {
        jakarta.servlet.http.HttpServletRequest request = org.mockito.Mockito.mock(jakarta.servlet.http.HttpServletRequest.class);
        when(request.getContentLengthLong()).thenReturn(4097L);

        assertThatThrownBy(() -> controller.getProductBatchSummaries(
                Language.RU,
                new ProductBatchSummaryRequest(List.of(1L)),
                request
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("4096");
        verify(productBatchSummaryService, never()).getSummaries(any(), any());
    }

    @Test
    void catalogQueryHasNoFiltersWhenOnlyBlankNullOrMissingValuesAreSent() {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("brand", "");
        params.add("mechanism", "[]");
        params.add("country", "null");
        params.add("search", "undefined");

        when(productCatalogService.getProducts(any(), any(), eq(Language.RU)))
                .thenReturn(new PageImpl<ProductShortResponse>(List.of()));

        controller.getCatalogProducts(Language.RU, params, PageRequest.of(0, 9));

        ArgumentCaptor<CatalogProductQuery> queryCaptor = ArgumentCaptor.forClass(CatalogProductQuery.class);
        verify(productCatalogService).getProducts(queryCaptor.capture(), any(Pageable.class), eq(Language.RU));

        CatalogProductQuery query = queryCaptor.getValue();
        assertThat(query.getCategoryCode()).isNull();
        assertThat(query.getSearch()).isNull();
        assertThat(query.getPriceMin()).isNull();
        assertThat(query.getPriceMax()).isNull();
        assertThat(query.getFilters()).isEmpty();
    }

    @Test
    void catalogRejectsUnsupportedSortInsteadOfSilentlyUsingNewest() {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

        assertThatThrownBy(() -> controller.getCatalogProducts(
                Language.RU,
                params,
                PageRequest.of(0, 9, Sort.by("popularity"))
        )).isInstanceOf(InvalidSortException.class)
                .hasMessage("Unsupported sort value.");

        verify(productCatalogService, never()).getProducts(any(), any(), any());
    }

    @Test
    void catalogMapsEveryDocumentedSortKey() {
        for (String sortKey : List.of("newest", "oldest", "priceAsc", "priceDesc", "nameAsc", "nameDesc")) {
            when(productCatalogService.getProducts(any(), any(), eq(Language.RU)))
                    .thenReturn(new PageImpl<ProductShortResponse>(List.of()));
            controller.getCatalogProducts(
                    Language.RU,
                    new LinkedMultiValueMap<>(),
                    PageRequest.of(0, 9, Sort.by(sortKey))
            );
        }

        verify(productCatalogService, org.mockito.Mockito.times(6)).getProducts(any(), any(), eq(Language.RU));
    }

    @Test
    void quickSearchBoundsLimitAndPassesQueryToCatalogService() {
        when(productCatalogService.quickSearch("romanson", 8, Language.RU))
                .thenReturn(List.of());

        controller.quickSearchProducts(Language.RU, " romanson ", 99);

        verify(productCatalogService).quickSearch("romanson", 8, Language.RU);
    }

    @Test
    void quickSearchUsesDefaultLimitWhenLimitIsMissing() {
        when(productCatalogService.quickSearch("appella", 6, Language.EN))
                .thenReturn(List.of());

        controller.quickSearchProducts(Language.EN, "appella", null);

        verify(productCatalogService).quickSearch("appella", 6, Language.EN);
    }

    @Test
    void quickSearchReturnsEmptyListForShortQueryWithoutCallingService() {
        var response = controller.quickSearchProducts(Language.RU, "r", 2);

        assertThat(response.getBody()).isEmpty();
        verify(productCatalogService, never()).quickSearch(any(), any(), any());
    }

    @Test
    void productReviewsMapQueryParamsAndCapPageSize() {
        when(productReviewService.getApproved(
                eq(42L),
                eq(5),
                eq(true),
                eq("highestRating"),
                any(Pageable.class)
        )).thenReturn(new PageImpl<PublicProductReviewResponse>(List.of()));

        controller.getProductReviews(42L, Language.RU, 2, 99, "highestRating", 5, "true");

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productReviewService).getApproved(
                eq(42L),
                eq(5),
                eq(true),
                eq("highestRating"),
                pageableCaptor.capture()
        );

        assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(2);
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(15);
    }

    @Test
    void productReviewsRejectInvalidHasTextParam() {
        assertThatThrownBy(() -> controller.getProductReviews(
                42L,
                Language.RU,
                0,
                15,
                "newest",
                null,
                "yes"
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("hasText must be true or false");
    }

    @Test
    void recommendationsDelegateBoundedContractToService() {
        when(productRecommendationService.getRecommendations(45L, Language.KZ, 99))
                .thenReturn(List.<ProductRecommendationResponse>of());

        var response = controller.getProductRecommendations(45L, Language.KZ, 99);

        assertThat(response.getBody()).isEmpty();
        verify(productRecommendationService).getRecommendations(45L, Language.KZ, 99);
    }

    @Test
    void recommendationsReturnEmptyWhenTransactionBoundaryFails() {
        when(productRecommendationService.getRecommendations(28L, Language.RU, 12))
                .thenThrow(new RuntimeException("transaction marked rollback-only"));

        var response = controller.getProductRecommendations(28L, Language.RU, 12);

        assertThat(response.getBody()).isEmpty();
        verify(productRecommendationService).getRecommendations(28L, Language.RU, 12);
    }
}
