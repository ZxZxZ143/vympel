package com.shop.vympel.services.watchDetail;

import com.shop.vympel.db.entity.features.Country;
import com.shop.vympel.db.entity.features.CountryI18n;
import com.shop.vympel.db.entity.features.CountryI18nId;
import com.shop.vympel.db.entity.features.InteriorFeature;
import com.shop.vympel.db.entity.features.Material;
import com.shop.vympel.db.entity.i18n.InteriorFeatureI18n;
import com.shop.vympel.db.entity.i18n.InteriorFeatureI18nId;
import com.shop.vympel.db.entity.i18n.MaterialI18n;
import com.shop.vympel.db.entity.i18n.MaterialI18nId;
import com.shop.vympel.db.entity.product.InteriorClockDetail;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.CountryRepository;
import com.shop.vympel.db.repositories.product.features.CountryI18nRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureI18nRepository;
import com.shop.vympel.db.repositories.product.features.InteriorFeatureRepository;
import com.shop.vympel.db.repositories.product.features.MaterialI18nRepository;
import com.shop.vympel.db.repositories.product.features.MaterialRepository;
import com.shop.vympel.db.repositories.product.watchDetail.InteriorClockDetailRepository;
import com.shop.vympel.dtos.product.details.InteriorClockDetailCreateRequest;
import com.shop.vympel.dtos.product.details.InteriorClockDetailResponse;
import com.shop.vympel.dtos.product.details.InteriorClockDetailUpdateRequest;
import com.shop.vympel.dtos.product.features.FeatureDto;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InteriorClockDetailServiceImpl {
    private final InteriorClockDetailRepository interiorClockDetailRepository;
    private final CountryRepository countryRepository;
    private final MaterialRepository materialRepository;
    private final InteriorFeatureRepository interiorFeatureRepository;
    private final CountryI18nRepository countryI18nRepository;
    private final MaterialI18nRepository materialI18nRepository;
    private final InteriorFeatureI18nRepository interiorFeatureI18nRepository;

    @Transactional(readOnly = true)
    public InteriorClockDetailResponse getInteriorClockDetailByIdOrNull(Long productId, Language lang) {
        return interiorClockDetailRepository.findByProduct_Id(productId)
                .map(detail -> toResponse(detail, lang))
                .orElse(null);
    }

    @Transactional
    public InteriorClockDetail create(InteriorClockDetailCreateRequest request, Product product) {
        if (request == null) {
            throw new IllegalArgumentException("interiorClockDetails is required for interior clock categories");
        }

        InteriorClockDetail detail = new InteriorClockDetail();
        detail.setProduct(product);
        applyCreate(detail, request);
        return interiorClockDetailRepository.save(detail);
    }

    @Transactional
    public InteriorClockDetail update(InteriorClockDetailUpdateRequest request, Product product) {
        if (request == null) {
            return interiorClockDetailRepository.findByProduct_Id(product.getId()).orElse(null);
        }

        InteriorClockDetail detail = interiorClockDetailRepository.findByProduct_Id(product.getId())
                .orElseGet(() -> {
                    InteriorClockDetail newDetail = new InteriorClockDetail();
                    newDetail.setProduct(product);
                    return newDetail;
                });

        applyUpdate(detail, request);
        return interiorClockDetailRepository.save(detail);
    }

    private void applyCreate(InteriorClockDetail detail, InteriorClockDetailCreateRequest request) {
        detail.setProductionCountry(countryOrNull(request.getProductionCountryId()));
        detail.setCaseMaterial(materialOrNull(request.getCaseMaterialId()));
        detail.setColor(interiorFeatureOrNull(request.getColorId()));
        detail.setStyle(interiorFeatureOrNull(request.getStyleId()));
        detail.setMechanismType(interiorFeatureOrNull(request.getMechanismTypeId()));
        detail.setPowerType(interiorFeatureOrNull(request.getPowerTypeId()));
        detail.setDimensions(trimToNull(request.getDimensions()));
        detail.setWeightGrams(request.getWeightGrams());
        detail.setWarrantyMonths(request.getWarrantyMonths());
    }

    private void applyUpdate(InteriorClockDetail detail, InteriorClockDetailUpdateRequest request) {
        if (request.getProductionCountryId() != null) detail.setProductionCountry(country(request.getProductionCountryId()));
        if (request.getCaseMaterialId() != null) detail.setCaseMaterial(material(request.getCaseMaterialId()));
        if (request.getColorId() != null) detail.setColor(interiorFeature(request.getColorId()));
        if (request.getStyleId() != null) detail.setStyle(interiorFeatureOrNull(request.getStyleId()));
        if (request.getMechanismTypeId() != null) detail.setMechanismType(interiorFeature(request.getMechanismTypeId()));
        if (request.getPowerTypeId() != null) detail.setPowerType(interiorFeature(request.getPowerTypeId()));
        if (request.getDimensions() != null) detail.setDimensions(trimToNull(request.getDimensions()));
        if (request.getWeightGrams() != null) detail.setWeightGrams(request.getWeightGrams());
        if (request.getWarrantyMonths() != null) detail.setWarrantyMonths(request.getWarrantyMonths());
    }

    private InteriorClockDetailResponse toResponse(InteriorClockDetail detail, Language lang) {
        return new InteriorClockDetailResponse(
                detail.getProduct().getId(),
                countryDto(detail.getProductionCountry(), lang),
                materialDto(detail.getCaseMaterial(), lang),
                interiorFeatureDto(detail.getColor(), lang),
                interiorFeatureDto(detail.getStyle(), lang),
                interiorFeatureDto(detail.getMechanismType(), lang),
                interiorFeatureDto(detail.getPowerType(), lang),
                detail.getDimensions(),
                detail.getWeightGrams(),
                detail.getWarrantyMonths()
        );
    }

    private Country country(Long id) {
        return countryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Country not found: " + id));
    }

    private Country countryOrNull(Long id) {
        return id == null ? null : country(id);
    }

    private Material material(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + id));
    }

    private Material materialOrNull(Long id) {
        return id == null ? null : material(id);
    }

    private InteriorFeature interiorFeature(Long id) {
        return interiorFeatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interior feature not found: " + id));
    }

    private InteriorFeature interiorFeatureOrNull(Long id) {
        return id == null ? null : interiorFeature(id);
    }

    private FeatureDto countryDto(Country country, Language lang) {
        if (country == null) return null;

        CountryI18nId id = new CountryI18nId();
        id.setCountryId(country.getId());
        id.setLang(lang.getValue());

        String name = countryI18nRepository.findById(id)
                .map(CountryI18n::getName)
                .orElse(country.getCode());

        return new FeatureDto(country.getId(), name);
    }

    private FeatureDto materialDto(Material material, Language lang) {
        if (material == null) return null;

        MaterialI18nId id = new MaterialI18nId();
        id.setMaterialId(material.getId());
        id.setLang(lang.getValue());

        String name = materialI18nRepository.findById(id)
                .map(MaterialI18n::getName)
                .orElse(material.getCode());

        return new FeatureDto(material.getId(), name);
    }

    private FeatureDto interiorFeatureDto(InteriorFeature feature, Language lang) {
        if (feature == null) return null;

        InteriorFeatureI18nId id = new InteriorFeatureI18nId();
        id.setFeatureId(feature.getId());
        id.setLang(lang.getValue());

        String name = interiorFeatureI18nRepository.findById(id)
                .map(InteriorFeatureI18n::getName)
                .orElse(feature.getCode());

        return new FeatureDto(feature.getId(), name);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
