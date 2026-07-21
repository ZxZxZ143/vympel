package com.shop.vympel.services.catalog;

import com.shop.vympel.db.entity.product.Category;
import com.shop.vympel.db.repositories.CountryRepository;
import com.shop.vympel.db.repositories.product.CatalogFacetRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository;
import com.shop.vympel.db.repositories.product.features.*;
import com.shop.vympel.db.repositories.product.watchDetail.InteriorClockDetailRepository;
import com.shop.vympel.db.repositories.product.watchDetail.WatchDetailRepository;
import com.shop.vympel.dtos.catalog.CatalogFiltersResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.mappers.product.ProductMapper;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.productName.ProductNameService;
import com.shop.vympel.services.review.ProductReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductCatalogServiceTest {
    @Mock ProductRepository productRepository;
    @Mock PublicProductQueryService publicProductQueryService;
    @Mock ProductMapper productMapper;
    @Mock ProductNameService productNameService;
    @Mock ObjectStorageService objectStorageService;
    @Mock CatalogCategoryProfileService categoryProfileService;
    @Mock BrandRepository brandRepository;
    @Mock WatchDetailRepository watchDetailRepository;
    @Mock InteriorClockDetailRepository interiorClockDetailRepository;
    @Mock CountryRepository countryRepository;
    @Mock MechanismI18nRepository mechanismI18nRepository;
    @Mock GenderI18nRepository genderI18nRepository;
    @Mock MaterialI18nRepository materialI18nRepository;
    @Mock GlassTypeI18nRepository glassTypeI18nRepository;
    @Mock StoneInlayI18nRepository stoneInlayI18nRepository;
    @Mock CountryI18nRepository countryI18nRepository;
    @Mock InteriorFeatureI18nRepository interiorFeatureI18nRepository;
    @Mock CollectionI18nRepository collectionI18nRepository;
    @Mock ProductReviewService productReviewService;
    @Mock CatalogFacetRepository facetRepository;
    @Mock PublicProductSummaryRepository summaryRepository;

    private ProductCatalogService service;

    @BeforeEach
    void setUp() {
        service = new ProductCatalogService(
                productRepository, publicProductQueryService, productMapper, productNameService,
                objectStorageService, categoryProfileService, brandRepository, watchDetailRepository,
                interiorClockDetailRepository, countryRepository, mechanismI18nRepository,
                genderI18nRepository, materialI18nRepository, glassTypeI18nRepository,
                stoneInlayI18nRepository, countryI18nRepository, interiorFeatureI18nRepository,
                collectionI18nRepository, productReviewService, facetRepository, summaryRepository,
                new SimpleMeterRegistry()
        );
    }

    @Test
    void wristwatchFacetCountIsFixedRegardlessOfOptionCount() {
        List<Long> scope = List.of(10L, 11L);
        when(categoryProfileService.resolveContext("watch-wrist"))
                .thenReturn(new CatalogCategoryContext(category(10L, "WATCH_WRIST"), CatalogCategoryProfile.WRISTWATCH, null, scope));
        when(facetRepository.findBaseFacets(scope, "ru")).thenReturn(List.of(
                row("price", null, null, 2, "100", "200"),
                row("brand", "1", "Brand", 2, null, null),
                row("country", "2", "Country", 2, null, null)
        ));
        when(facetRepository.findWristFacets(scope, "ru")).thenReturn(List.of(
                row("mechanism", "101", "Quartz", 1, null, null),
                row("mechanism", "102", "Mechanical", 1, null, null),
                row("caseSize", "40", "40", 1, null, null)
        ));

        CatalogFiltersResponse response = service.getFilters("watch-wrist", Language.RU);

        assertThat(response.getFilters()).hasSize(10);
        assertThat(response.getFilters().get(3).getOptions()).hasSize(2);
        verify(facetRepository).findBaseFacets(scope, "ru");
        verify(facetRepository).findWristFacets(scope, "ru");
        verify(productRepository, never()).findAll(org.mockito.ArgumentMatchers.any(org.springframework.data.jpa.domain.Specification.class));
        verify(productRepository, never()).count(org.mockito.ArgumentMatchers.any(org.springframework.data.jpa.domain.Specification.class));
    }

    @Test
    void interiorProfileUsesOneProfileAggregation() {
        List<Long> scope = List.of(20L);
        when(categoryProfileService.resolveContext("interior"))
                .thenReturn(new CatalogCategoryContext(category(20L, "INTERIOR"), CatalogCategoryProfile.INTERIOR_CLOCK, null, scope));
        when(facetRepository.findBaseFacets(scope, "kk")).thenReturn(List.of(row("price", null, null, 0, null, null)));
        when(facetRepository.findInteriorFacets(scope, "kk")).thenReturn(List.of(
                row("interiorStyle", "7", "Classic", 4, null, null)
        ));

        CatalogFiltersResponse response = service.getFilters("interior", Language.KZ);

        assertThat(response.getFilters()).hasSize(8);
        verify(facetRepository).findBaseFacets(scope, "kk");
        verify(facetRepository).findInteriorFacets(scope, "kk");
        verify(facetRepository, never()).findWristFacets(scope, "kk");
    }

    private Category category(Long id, String code) {
        Category category = new Category();
        category.setId(id);
        category.setCode(code);
        return category;
    }

    private CatalogFacetRepository.FacetRow row(
            String key, String value, String label, long count, String min, String max
    ) {
        return new CatalogFacetRepository.FacetRow(
                key, value, label, count,
                min == null ? null : new BigDecimal(min),
                max == null ? null : new BigDecimal(max)
        );
    }
}
