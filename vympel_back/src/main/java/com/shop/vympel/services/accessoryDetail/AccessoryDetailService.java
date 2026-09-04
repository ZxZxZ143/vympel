package com.shop.vympel.services.accessoryDetail;

import com.shop.vympel.db.entity.features.InteriorFeature;
import com.shop.vympel.db.entity.features.Material;
import com.shop.vympel.db.entity.i18n.InteriorFeatureI18n;
import com.shop.vympel.db.entity.i18n.InteriorFeatureI18nId;
import com.shop.vympel.db.entity.i18n.MaterialI18n;
import com.shop.vympel.db.entity.i18n.MaterialI18nId;
import com.shop.vympel.db.entity.product.AccessoryDetail;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureI18nRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureRepository;
import com.shop.vympel.db.repositories.product.features.MaterialI18nRepository;
import com.shop.vympel.db.repositories.product.features.MaterialRepository;
import com.shop.vympel.db.repositories.product.watchDetail.AccessoryDetailRepository;
import com.shop.vympel.dtos.product.details.AccessoryDetailCreateRequest;
import com.shop.vympel.dtos.product.details.AccessoryDetailResponse;
import com.shop.vympel.dtos.product.details.AccessoryDetailUpdateRequest;
import com.shop.vympel.dtos.product.features.FeatureDto;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccessoryDetailService {
    private final AccessoryDetailRepository accessoryDetailRepository;
    private final MaterialRepository materialRepository;
    private final InteriorFeatureRepository interiorFeatureRepository;
    private final MaterialI18nRepository materialI18nRepository;
    private final InteriorFeatureI18nRepository interiorFeatureI18nRepository;

    public AccessoryDetailResponse getByProductIdOrNull(Long productId, Language language) {
        return accessoryDetailRepository.findByProduct_Id(productId)
                .map(detail -> toResponse(detail, language))
                .orElse(null);
    }

    public AccessoryDetail create(AccessoryDetailCreateRequest request, Product product) {
        if (request == null) {
            throw new IllegalArgumentException("accessoryDetails request is required");
        }

        AccessoryDetail detail = new AccessoryDetail();
        detail.setProduct(product);
        apply(detail, request.getClaspType(), request.getCaseMaterialId(), request.getInsertMaterialId(),
                request.getHasInsert(), request.getColorId(), request.getLength());
        return accessoryDetailRepository.save(detail);
    }

    public AccessoryDetail update(AccessoryDetailUpdateRequest request, Product product) {
        if (request == null) {
            throw new IllegalArgumentException("accessoryDetails request is required");
        }

        AccessoryDetail detail = accessoryDetailRepository.findByProduct_Id(product.getId())
                .orElseGet(() -> {
                    AccessoryDetail newDetail = new AccessoryDetail();
                    newDetail.setProduct(product);
                    return newDetail;
                });
        apply(detail, request.getClaspType(), request.getCaseMaterialId(), request.getInsertMaterialId(),
                request.getHasInsert(), request.getColorId(), request.getLength());
        return accessoryDetailRepository.save(detail);
    }

    private void apply(
            AccessoryDetail detail,
            String claspType,
            Long caseMaterialId,
            Long insertMaterialId,
            Boolean hasInsert,
            Long colorId,
            String length
    ) {
        detail.setClaspType(trimToNull(claspType));
        detail.setCaseMaterial(materialOrNull(caseMaterialId));
        detail.setInsertMaterial(materialOrNull(insertMaterialId));
        detail.setHasInsert(hasInsert);
        detail.setColor(colorOrNull(colorId));
        detail.setLength(trimToNull(length));
    }

    private AccessoryDetailResponse toResponse(AccessoryDetail detail, Language language) {
        return new AccessoryDetailResponse(
                detail.getProduct().getId(),
                detail.getClaspType(),
                materialDto(detail.getCaseMaterial(), language),
                materialDto(detail.getInsertMaterial(), language),
                detail.getHasInsert(),
                interiorFeatureDto(detail.getColor(), language),
                detail.getLength()
        );
    }

    private Material materialOrNull(Long id) {
        if (id == null) {
            return null;
        }
        return materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + id));
    }

    private InteriorFeature colorOrNull(Long id) {
        if (id == null) {
            return null;
        }
        InteriorFeature feature = interiorFeatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found: " + id));
        if (!Boolean.TRUE.equals(feature.getActive()) || !"COLOR".equals(feature.getFeatureType())) {
            throw new IllegalArgumentException("Accessory color must reference an active COLOR feature");
        }
        return feature;
    }

    private FeatureDto materialDto(Material material, Language language) {
        if (material == null) {
            return null;
        }
        MaterialI18nId id = new MaterialI18nId();
        id.setMaterialId(material.getId());
        id.setLang(language.getValue());
        String name = materialI18nRepository.findById(id)
                .map(MaterialI18n::getName)
                .orElse(material.getCode());
        return new FeatureDto(material.getId(), name);
    }

    private FeatureDto interiorFeatureDto(InteriorFeature feature, Language language) {
        if (feature == null) {
            return null;
        }
        InteriorFeatureI18nId id = new InteriorFeatureI18nId();
        id.setFeatureId(feature.getId());
        id.setLang(language.getValue());
        String name = interiorFeatureI18nRepository.findById(id)
                .map(InteriorFeatureI18n::getName)
                .orElse(feature.getCode());
        return new FeatureDto(feature.getId(), name);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
