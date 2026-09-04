package com.shop.vympel.services.watchDetail;

import com.shop.vympel.db.entity.features.InteriorFeature;
import com.shop.vympel.db.entity.features.WatchAttributeOption;
import com.shop.vympel.db.entity.features.WatchFeature;
import com.shop.vympel.db.entity.i18n.InteriorFeatureI18n;
import com.shop.vympel.db.entity.i18n.InteriorFeatureI18nId;
import com.shop.vympel.db.entity.i18n.WatchAttributeOptionI18n;
import com.shop.vympel.db.entity.i18n.WatchAttributeOptionI18nId;
import com.shop.vympel.db.entity.i18n.WatchFeatureI18n;
import com.shop.vympel.db.entity.i18n.WatchFeatureI18nId;
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
import com.shop.vympel.dtos.product.details.WatchDetailResponse;
import com.shop.vympel.dtos.product.details.WatchDetailUpdateRequest;
import com.shop.vympel.dtos.product.features.FeatureDto;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.mappers.product.WatchDetailMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class WatchDetailServiceImpl implements WatchDetailService {
    private final WatchDetailRepository watchDetailRepository;
    private final WatchDetailMapper watchDetailMapper;
    private final WatchAttributeOptionRepository watchAttributeOptionRepository;
    private final WatchAttributeOptionI18nRepository watchAttributeOptionI18nRepository;
    private final InteriorFeatureRepository interiorFeatureRepository;
    private final InteriorFeatureI18nRepository interiorFeatureI18nRepository;
    private final FeatureRepository featureRepository;
    private final WatchFeatureI18nRepository watchFeatureI18nRepository;

    @Override
    @Transactional()
    public WatchDetailResponse getWatchDetailById(Long id, Language  lang) {
        return toResponse(
                watchDetailRepository.findByProduct_Id(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Watch detail not found")),
                lang
        );
    }

    @Override
    @Transactional()
    public WatchDetailResponse getWatchDetailByIdOrNull(Long id, Language  lang) {
        return watchDetailRepository.findByProduct_Id(id)
                .map(detail -> toResponse(detail, lang))
                .orElse(null);
    }

    @Override
    @Transactional
    public WatchDetail create(WatchDetailCreateRequest watchDetailCreateRequest, Product product) {
        if (watchDetailCreateRequest == null) {
            throw new IllegalArgumentException("watchDetails request is required");
        }
        WatchDetail watchDetail = watchDetailMapper.toEntity(watchDetailCreateRequest);
        watchDetail.setProduct(product);
        applyExtended(
                watchDetail,
                watchDetailCreateRequest.getDialTypeId(),
                watchDetailCreateRequest.getDialMarkingId(),
                watchDetailCreateRequest.getPowerSourceId(),
                watchDetailCreateRequest.getWaterResistanceId(),
                watchDetailCreateRequest.getStrapColorId(),
                watchDetailCreateRequest.getDialColorId(),
                watchDetailCreateRequest.getPackageContents(),
                watchDetailCreateRequest.getFeatureIds()
        );
        return watchDetailRepository.save(watchDetail);
    }

    @Override
    @Transactional
    public WatchDetail update(WatchDetailUpdateRequest watchDetailUpdateRequest, Product product) {
        WatchDetail watchDetail = watchDetailRepository.findByProduct_Id(product.getId())
                .orElseGet(() -> {
                    WatchDetail newDetail = new WatchDetail();
                    newDetail.setProduct(product);
                    return newDetail;
                });

        watchDetailMapper.updateEntity(watchDetail, watchDetailUpdateRequest);
        applyExtended(
                watchDetail,
                watchDetailUpdateRequest.getDialTypeId(),
                watchDetailUpdateRequest.getDialMarkingId(),
                watchDetailUpdateRequest.getPowerSourceId(),
                watchDetailUpdateRequest.getWaterResistanceId(),
                watchDetailUpdateRequest.getStrapColorId(),
                watchDetailUpdateRequest.getDialColorId(),
                watchDetailUpdateRequest.getPackageContents(),
                watchDetailUpdateRequest.getFeatureIds()
        );

        return watchDetailRepository.save(watchDetail);
    }

    private void applyExtended(
            WatchDetail detail,
            Long dialTypeId,
            Long dialMarkingId,
            Long powerSourceId,
            Long waterResistanceId,
            Long strapColorId,
            Long dialColorId,
            String packageContents,
            List<Long> featureIds
    ) {
        detail.setDialType(optionOrNull(dialTypeId, "DIAL_TYPE"));
        detail.setDialMarking(optionOrNull(dialMarkingId, "DIAL_MARKING"));
        detail.setPowerSource(optionOrNull(powerSourceId, "POWER_SOURCE"));
        detail.setWaterResistanceOption(optionOrNull(waterResistanceId, "WATER_RESISTANCE"));
        detail.setStrapColor(colorOrNull(strapColorId));
        detail.setDialColor(colorOrNull(dialColorId));
        detail.setPackageContents(trimToNull(packageContents));
        detail.getFeatures().clear();
        detail.getFeatures().addAll(features(featureIds));
    }

    private WatchAttributeOption optionOrNull(Long id, String expectedType) {
        if (id == null) return null;
        WatchAttributeOption option = watchAttributeOptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Watch option not found: " + id));
        if (!Boolean.TRUE.equals(option.getActive()) || !expectedType.equals(option.getOptionType())) {
            throw new IllegalArgumentException("Watch option has an invalid type");
        }
        return option;
    }

    private InteriorFeature colorOrNull(Long id) {
        if (id == null) return null;
        InteriorFeature color = interiorFeatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found: " + id));
        if (!Boolean.TRUE.equals(color.getActive()) || !"COLOR".equals(color.getFeatureType())) {
            throw new IllegalArgumentException("Watch color must reference an active COLOR feature");
        }
        return color;
    }

    private Set<WatchFeature> features(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Set.of();
        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>(ids);
        List<WatchFeature> found = featureRepository.findAllById(uniqueIds);
        if (found.size() != uniqueIds.size() || found.stream().anyMatch(feature -> !Boolean.TRUE.equals(feature.getActive()))) {
            throw new ResourceNotFoundException("One or more watch features were not found");
        }
        return new LinkedHashSet<>(found);
    }

    private WatchDetailResponse toResponse(WatchDetail detail, Language language) {
        WatchDetailResponse response = watchDetailMapper.toResponse(detail, language);
        response.setDialType(optionDto(detail.getDialType(), language));
        response.setDialMarking(optionDto(detail.getDialMarking(), language));
        response.setPowerSource(optionDto(detail.getPowerSource(), language));
        response.setWaterResistanceOption(optionDto(detail.getWaterResistanceOption(), language));
        response.setStrapColor(colorDto(detail.getStrapColor(), language));
        response.setDialColor(colorDto(detail.getDialColor(), language));
        response.setPackageContents(detail.getPackageContents());
        response.setFeatures(detail.getFeatures().stream()
                .map(feature -> featureDto(feature, language))
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .toList());
        return response;
    }

    private FeatureDto optionDto(WatchAttributeOption option, Language language) {
        if (option == null) return null;
        WatchAttributeOptionI18nId id = new WatchAttributeOptionI18nId();
        id.setOptionId(option.getId());
        id.setLang(language.getValue());
        String name = watchAttributeOptionI18nRepository.findById(id)
                .map(WatchAttributeOptionI18n::getName)
                .orElseGet(() -> watchAttributeOptionI18nRepository.findById(optionTranslationId(option.getId(), Language.RU))
                        .map(WatchAttributeOptionI18n::getName)
                        .orElse(option.getCode()));
        return new FeatureDto(option.getId(), name);
    }

    private FeatureDto colorDto(InteriorFeature color, Language language) {
        if (color == null) return null;
        InteriorFeatureI18nId id = new InteriorFeatureI18nId();
        id.setFeatureId(color.getId());
        id.setLang(language.getValue());
        String name = interiorFeatureI18nRepository.findById(id)
                .map(InteriorFeatureI18n::getName)
                .orElseGet(() -> interiorFeatureI18nRepository.findById(interiorTranslationId(color.getId(), Language.RU))
                        .map(InteriorFeatureI18n::getName)
                        .orElse(color.getCode()));
        return new FeatureDto(color.getId(), name);
    }

    private FeatureDto featureDto(WatchFeature feature, Language language) {
        WatchFeatureI18nId id = new WatchFeatureI18nId();
        id.setFeatureId(feature.getId());
        id.setLang(language.getValue());
        String name = watchFeatureI18nRepository.findById(id)
                .map(WatchFeatureI18n::getName)
                .orElseGet(() -> watchFeatureI18nRepository.findById(featureTranslationId(feature.getId(), Language.RU))
                        .map(WatchFeatureI18n::getName)
                        .orElse(feature.getCode()));
        return new FeatureDto(feature.getId(), name);
    }

    private WatchAttributeOptionI18nId optionTranslationId(Long optionId, Language language) {
        WatchAttributeOptionI18nId id = new WatchAttributeOptionI18nId();
        id.setOptionId(optionId);
        id.setLang(language.getValue());
        return id;
    }

    private InteriorFeatureI18nId interiorTranslationId(Long featureId, Language language) {
        InteriorFeatureI18nId id = new InteriorFeatureI18nId();
        id.setFeatureId(featureId);
        id.setLang(language.getValue());
        return id;
    }

    private WatchFeatureI18nId featureTranslationId(Long featureId, Language language) {
        WatchFeatureI18nId id = new WatchFeatureI18nId();
        id.setFeatureId(featureId);
        id.setLang(language.getValue());
        return id;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
