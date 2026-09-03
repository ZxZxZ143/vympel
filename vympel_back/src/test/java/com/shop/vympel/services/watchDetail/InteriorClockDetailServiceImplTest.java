package com.shop.vympel.services.watchDetail;

import com.shop.vympel.db.entity.features.Country;
import com.shop.vympel.db.entity.features.InteriorFeature;
import com.shop.vympel.db.entity.product.InteriorClockDetail;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.product.features.CountryI18nRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureI18nRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureRepository;
import com.shop.vympel.db.repositories.product.features.MaterialI18nRepository;
import com.shop.vympel.db.repositories.product.features.MaterialRepository;
import com.shop.vympel.db.repositories.product.watchDetail.InteriorClockDetailRepository;
import com.shop.vympel.dtos.product.details.InteriorClockDetailCreateRequest;
import com.shop.vympel.dtos.product.details.InteriorClockDetailUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InteriorClockDetailServiceImplTest {
    @Mock InteriorClockDetailRepository interiorClockDetailRepository;
    @Mock MaterialRepository materialRepository;
    @Mock InteriorFeatureRepository interiorFeatureRepository;
    @Mock CountryI18nRepository countryI18nRepository;
    @Mock MaterialI18nRepository materialI18nRepository;
    @Mock InteriorFeatureI18nRepository interiorFeatureI18nRepository;

    private InteriorClockDetailServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new InteriorClockDetailServiceImpl(
                interiorClockDetailRepository,
                materialRepository,
                interiorFeatureRepository,
                countryI18nRepository,
                materialI18nRepository,
                interiorFeatureI18nRepository
        );
    }

    @Test
    void createKeepsProductionCountryNullWhenItWasNotSubmitted() {
        Product product = product(1L);
        Country japan = country(2L);
        InteriorClockDetailCreateRequest request = new InteriorClockDetailCreateRequest();
        when(interiorClockDetailRepository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(request, product, japan);

        ArgumentCaptor<InteriorClockDetail> captor = ArgumentCaptor.forClass(InteriorClockDetail.class);
        verify(interiorClockDetailRepository).save(captor.capture());
        assertThat(captor.getValue().getProductionCountry()).isNull();
    }

    @Test
    void createRejectsAHandCraftedMismatchedCountry() {
        InteriorClockDetailCreateRequest request = new InteriorClockDetailCreateRequest();
        request.setProductionCountryId(99L);

        assertThatThrownBy(() -> service.create(request, product(1L), country(2L)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must match");
        verify(interiorClockDetailRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateClearsAnExistingProductionCountryWhenItIsOmitted() {
        Product product = product(1L);
        Country oldCountry = country(3L);
        Country requiredCountry = country(2L);
        InteriorClockDetail detail = new InteriorClockDetail();
        detail.setProduct(product);
        detail.setProductionCountry(oldCountry);
        when(interiorClockDetailRepository.findByProduct_Id(1L)).thenReturn(Optional.of(detail));
        when(interiorClockDetailRepository.save(detail)).thenReturn(detail);

        service.update(new InteriorClockDetailUpdateRequest(), product, requiredCountry);

        assertThat(detail.getProductionCountry()).isNull();
        verify(interiorClockDetailRepository).save(detail);
    }

    @Test
    void createRejectsAReferenceFromTheWrongInteriorFeatureDictionary() {
        InteriorFeature color = new InteriorFeature();
        color.setId(4L);
        color.setFeatureType("COLOR");
        color.setActive(true);
        when(interiorFeatureRepository.findById(4L)).thenReturn(Optional.of(color));

        InteriorClockDetailCreateRequest request = new InteriorClockDetailCreateRequest();
        request.setStyleId(4L);

        assertThatThrownBy(() -> service.create(request, product(1L), country(2L)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("active STYLE");
        verify(interiorClockDetailRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private Product product(Long id) {
        Product product = new Product();
        product.setId(id);
        return product;
    }

    private Country country(Long id) {
        Country country = new Country();
        country.setId(id);
        return country;
    }
}
