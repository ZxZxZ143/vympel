package com.shop.vympel.services.accessoryDetail;

import com.shop.vympel.db.entity.features.InteriorFeature;
import com.shop.vympel.db.entity.features.Material;
import com.shop.vympel.db.entity.product.AccessoryDetail;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureI18nRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureRepository;
import com.shop.vympel.db.repositories.product.features.MaterialI18nRepository;
import com.shop.vympel.db.repositories.product.features.MaterialRepository;
import com.shop.vympel.db.repositories.product.watchDetail.AccessoryDetailRepository;
import com.shop.vympel.dtos.product.details.AccessoryDetailCreateRequest;
import com.shop.vympel.dtos.product.details.AccessoryDetailUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessoryDetailServiceTest {
    @Mock AccessoryDetailRepository accessoryDetailRepository;
    @Mock MaterialRepository materialRepository;
    @Mock InteriorFeatureRepository interiorFeatureRepository;
    @Mock MaterialI18nRepository materialI18nRepository;
    @Mock InteriorFeatureI18nRepository interiorFeatureI18nRepository;

    private AccessoryDetailService service;

    @BeforeEach
    void setUp() {
        service = new AccessoryDetailService(
                accessoryDetailRepository,
                materialRepository,
                interiorFeatureRepository,
                materialI18nRepository,
                interiorFeatureI18nRepository
        );
    }

    @Test
    void createAcceptsAnAccessoryWithNoCharacteristics() {
        Product product = product(1L);
        when(accessoryDetailRepository.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new AccessoryDetailCreateRequest(), product);

        ArgumentCaptor<AccessoryDetail> captor = ArgumentCaptor.forClass(AccessoryDetail.class);
        verify(accessoryDetailRepository).save(captor.capture());
        AccessoryDetail detail = captor.getValue();
        assertThat(detail.getProduct()).isSameAs(product);
        assertThat(detail.getClaspType()).isNull();
        assertThat(detail.getCaseMaterial()).isNull();
        assertThat(detail.getInsertMaterial()).isNull();
        assertThat(detail.getHasInsert()).isNull();
        assertThat(detail.getColor()).isNull();
        assertThat(detail.getLength()).isNull();
    }

    @Test
    void createPreservesFalseAndAllSubmittedCharacteristics() {
        Product product = product(1L);
        Material caseMaterial = material(2L);
        Material insertMaterial = material(3L);
        InteriorFeature color = new InteriorFeature();
        color.setId(4L);
        color.setFeatureType("COLOR");
        when(materialRepository.findById(2L)).thenReturn(Optional.of(caseMaterial));
        when(materialRepository.findById(3L)).thenReturn(Optional.of(insertMaterial));
        when(interiorFeatureRepository.findById(4L)).thenReturn(Optional.of(color));
        when(accessoryDetailRepository.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AccessoryDetailCreateRequest request = new AccessoryDetailCreateRequest(
                "  Lobster clasp  ", 2L, 3L, false, 4L, "  45 cm  "
        );
        AccessoryDetail detail = service.create(request, product);

        assertThat(detail.getClaspType()).isEqualTo("Lobster clasp");
        assertThat(detail.getCaseMaterial()).isSameAs(caseMaterial);
        assertThat(detail.getInsertMaterial()).isSameAs(insertMaterial);
        assertThat(detail.getHasInsert()).isFalse();
        assertThat(detail.getColor()).isSameAs(color);
        assertThat(detail.getLength()).isEqualTo("45 cm");
    }

    @Test
    void updateWithExplicitNullsClearsPreviouslySavedCharacteristics() {
        Product product = product(1L);
        AccessoryDetail detail = new AccessoryDetail();
        detail.setProduct(product);
        detail.setClaspType("Clasp");
        detail.setCaseMaterial(material(2L));
        detail.setInsertMaterial(material(3L));
        detail.setHasInsert(true);
        detail.setLength("50 cm");
        when(accessoryDetailRepository.findByProduct_Id(1L)).thenReturn(Optional.of(detail));
        when(accessoryDetailRepository.save(detail)).thenReturn(detail);

        service.update(new AccessoryDetailUpdateRequest(), product);

        assertThat(detail.getClaspType()).isNull();
        assertThat(detail.getCaseMaterial()).isNull();
        assertThat(detail.getInsertMaterial()).isNull();
        assertThat(detail.getHasInsert()).isNull();
        assertThat(detail.getColor()).isNull();
        assertThat(detail.getLength()).isNull();
    }

    private Product product(Long id) {
        Product product = new Product();
        product.setId(id);
        return product;
    }

    private Material material(Long id) {
        Material material = new Material();
        material.setId(id);
        return material;
    }
}
