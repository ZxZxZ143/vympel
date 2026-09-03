package com.shop.vympel.services.watchDetail;

import com.shop.vympel.db.entity.features.WatchAttributeOption;
import com.shop.vympel.db.entity.features.WatchFeature;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.WatchDetail;
import com.shop.vympel.db.repositories.product.features.FeatureRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureI18nRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureRepository;
import com.shop.vympel.db.repositories.product.features.WatchAttributeOptionI18nRepository;
import com.shop.vympel.db.repositories.product.features.WatchAttributeOptionRepository;
import com.shop.vympel.db.repositories.product.features.WatchFeatureI18nRepository;
import com.shop.vympel.db.repositories.product.watchDetail.WatchDetailRepository;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailUpdateRequest;
import com.shop.vympel.mappers.product.WatchDetailMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WatchDetailServiceImplTest {
    @Mock WatchDetailRepository watchDetailRepository;
    @Mock WatchDetailMapper watchDetailMapper;
    @Mock WatchAttributeOptionRepository watchAttributeOptionRepository;
    @Mock WatchAttributeOptionI18nRepository watchAttributeOptionI18nRepository;
    @Mock InteriorFeatureRepository interiorFeatureRepository;
    @Mock InteriorFeatureI18nRepository interiorFeatureI18nRepository;
    @Mock FeatureRepository featureRepository;
    @Mock WatchFeatureI18nRepository watchFeatureI18nRepository;

    private WatchDetailServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new WatchDetailServiceImpl(
                watchDetailRepository,
                watchDetailMapper,
                watchAttributeOptionRepository,
                watchAttributeOptionI18nRepository,
                interiorFeatureRepository,
                interiorFeatureI18nRepository,
                featureRepository,
                watchFeatureI18nRepository
        );
    }

    @Test
    void updateReplacesFeaturesWithoutDuplicatesAndSupportsExplicitClear() {
        Product product = product(1L);
        WatchDetail detail = new WatchDetail();
        detail.setProduct(product);
        WatchFeature oldFeature = feature(10L, "DATE");
        detail.getFeatures().add(oldFeature);
        when(watchDetailRepository.findByProduct_Id(1L)).thenReturn(Optional.of(detail));
        when(watchDetailRepository.save(detail)).thenReturn(detail);
        WatchFeature nextFeature = feature(11L, "BACKLIGHT");
        when(featureRepository.findAllById(any())).thenReturn(List.of(nextFeature));

        WatchDetailUpdateRequest replacement = new WatchDetailUpdateRequest();
        replacement.setFeatureIds(List.of(11L, 11L));
        service.update(replacement, product);

        assertThat(detail.getFeatures()).containsExactly(nextFeature);

        WatchDetailUpdateRequest clear = new WatchDetailUpdateRequest();
        clear.setFeatureIds(List.of());
        service.update(clear, product);

        assertThat(detail.getFeatures()).isEmpty();
    }

    @Test
    void createRejectsAWatchOptionFromTheWrongDictionary() {
        Product product = product(1L);
        WatchDetail detail = new WatchDetail();
        when(watchDetailMapper.toEntity(any())).thenReturn(detail);
        WatchAttributeOption powerSource = new WatchAttributeOption();
        powerSource.setId(20L);
        powerSource.setOptionType("POWER_SOURCE");
        powerSource.setActive(true);
        when(watchAttributeOptionRepository.findById(20L)).thenReturn(Optional.of(powerSource));

        WatchDetailCreateRequest request = new WatchDetailCreateRequest();
        request.setDialTypeId(20L);

        assertThatThrownBy(() -> service.create(request, product))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("invalid type");
        verify(watchDetailRepository, never()).save(any());
    }

    private Product product(Long id) {
        Product product = new Product();
        product.setId(id);
        return product;
    }

    private WatchFeature feature(Long id, String code) {
        WatchFeature feature = new WatchFeature();
        feature.setId(id);
        feature.setCode(code);
        feature.setActive(true);
        return feature;
    }
}
