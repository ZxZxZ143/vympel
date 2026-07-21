package com.shop.vympel.services.crm;

import com.shop.vympel.db.entity.features.*;
import com.shop.vympel.db.entity.i18n.*;
import com.shop.vympel.db.repositories.CountryRepository;
import com.shop.vympel.db.repositories.product.features.*;
import com.shop.vympel.db.repositories.product.watchDetail.WatchMechanismRepository;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.category.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class CrmReferenceService {
    private final CategoryService categoryService;
    private final BrandRepository brandRepository;
    private final CollectionRepository collectionRepository;
    private final WatchMechanismRepository watchMechanismRepository;
    private final GenderRepository genderRepository;
    private final MaterialRepository materialRepository;
    private final GlassTypeRepository glassTypeRepository;
    private final StoneInlayRepository stoneInlayRepository;
    private final CountryRepository countryRepository;
    private final InteriorFeatureRepository interiorFeatureRepository;
    private final CollectionI18nRepository collectionI18nRepository;
    private final MechanismI18nRepository mechanismI18nRepository;
    private final GenderI18nRepository genderI18nRepository;
    private final MaterialI18nRepository materialI18nRepository;
    private final GlassTypeI18nRepository glassTypeI18nRepository;
    private final StoneInlayI18nRepository stoneInlayI18nRepository;
    private final CountryI18nRepository countryI18nRepository;
    private final InteriorFeatureI18nRepository interiorFeatureI18nRepository;

    @Transactional(readOnly = true)
    public CrmReferencesResponse getReferences(Language language) {
        return new CrmReferencesResponse(
                categoryService.getAll(language),
                brandRepository.findAll()
                        .stream()
                        .map(brand -> option(brand.getId(), fallbackName(brand.getName(), brand.getCode()), brand.getCode()))
                        .sorted(Comparator.comparing(CrmReferenceOptionResponse::name))
                        .toList(),
                collectionRepository.findAll()
                        .stream()
                        .map(collection -> option(
                                collection.getId(),
                                collectionName(collection, language),
                                collection.getCode(),
                                collection.getBrand() == null ? null : collection.getBrand().getId()
                        ))
                        .sorted(Comparator.comparing(CrmReferenceOptionResponse::name))
                        .toList(),
                mapCodedOptions(watchMechanismRepository.findAll(), WatchMechanism::getId, WatchMechanism::getCode, this::mechanismName),
                mapCodedOptions(genderRepository.findAll(), Gender::getId, Gender::getCode, this::genderName),
                mapCodedOptions(materialRepository.findAll(), Material::getId, Material::getCode, this::materialName),
                mapCodedOptions(glassTypeRepository.findAll(), GlassType::getId, GlassType::getCode, this::glassTypeName),
                mapCodedOptions(stoneInlayRepository.findAll(), StoneInlay::getId, StoneInlay::getCode, this::stoneInlayName),
                mapCodedOptions(countryRepository.findAll(), Country::getId, Country::getCode, country -> countryName(country, language)),
                mapCodedOptions(interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("COLOR"), InteriorFeature::getId, InteriorFeature::getCode, feature -> interiorFeatureName(feature, language)),
                mapCodedOptions(interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("STYLE"), InteriorFeature::getId, InteriorFeature::getCode, feature -> interiorFeatureName(feature, language)),
                mapCodedOptions(interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("MECHANISM"), InteriorFeature::getId, InteriorFeature::getCode, feature -> interiorFeatureName(feature, language)),
                mapCodedOptions(interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("POWER"), InteriorFeature::getId, InteriorFeature::getCode, feature -> interiorFeatureName(feature, language))
        );
    }

    private <T> List<CrmReferenceOptionResponse> mapCodedOptions(
            List<T> references,
            Function<T, Long> idGetter,
            Function<T, String> codeGetter,
            Function<T, String> nameGetter
    ) {
        return references
                .stream()
                .map(reference -> option(idGetter.apply(reference), nameGetter.apply(reference), codeGetter.apply(reference)))
                .sorted(Comparator.comparing(CrmReferenceOptionResponse::name))
                .toList();
    }

    private CrmReferenceOptionResponse option(Long id, String name, String code) {
        return new CrmReferenceOptionResponse(id, name, code);
    }

    private CrmReferenceOptionResponse option(Long id, String name, String code, Long brandId) {
        return new CrmReferenceOptionResponse(id, name, code, brandId);
    }

    private String fallbackName(String name, String code) {
        return name == null || name.isBlank() ? code : name;
    }

    private String collectionName(Collection collection, Language language) {
        return collectionI18nRepository.findById(collectionI18nId(collection.getId(), language))
                .or(() -> collectionI18nRepository.findById(collectionI18nId(collection.getId(), Language.RU)))
                .map(CollectionI18n::getName)
                .orElse(fallbackName(collection.getName(), collection.getCode()));
    }

    private String mechanismName(WatchMechanism mechanism) {
        WatchMechanismI18nId id = new WatchMechanismI18nId();
        id.setMechanismId(mechanism.getId());
        id.setLang(Language.RU.getValue());
        return translatedName(mechanismI18nRepository, id, mechanism.getCode());
    }

    private String genderName(Gender gender) {
        GenderI18nId id = new GenderI18nId();
        id.setGenderId(gender.getId());
        id.setLang(Language.RU.getValue());
        return translatedName(genderI18nRepository, id, gender.getCode());
    }

    private String materialName(Material material) {
        MaterialI18nId id = new MaterialI18nId();
        id.setMaterialId(material.getId());
        id.setLang(Language.RU.getValue());
        return translatedName(materialI18nRepository, id, material.getCode());
    }

    private String glassTypeName(GlassType glassType) {
        GlassTypeI18nId id = new GlassTypeI18nId();
        id.setGlassTypeId(glassType.getId());
        id.setLang(Language.RU.getValue());
        return translatedName(glassTypeI18nRepository, id, glassType.getCode());
    }

    private String stoneInlayName(StoneInlay stoneInlay) {
        StoneInlayI18nId id = new StoneInlayI18nId();
        id.setStoneInlayId(stoneInlay.getId());
        id.setLang(Language.RU.getValue());
        return translatedName(stoneInlayI18nRepository, id, stoneInlay.getCode());
    }

    private String countryName(Country country, Language language) {
        CountryI18nId id = new CountryI18nId();
        id.setCountryId(country.getId());
        id.setLang(language.getValue());
        return countryI18nRepository.findById(id)
                .map(CountryI18n::getName)
                .orElse(country.getCode());
    }

    private String interiorFeatureName(InteriorFeature feature, Language language) {
        InteriorFeatureI18nId id = new InteriorFeatureI18nId();
        id.setFeatureId(feature.getId());
        id.setLang(language.getValue());
        return translatedName(interiorFeatureI18nRepository, id, feature.getCode());
    }

    private CollectionI18nId collectionI18nId(Long collectionId, Language language) {
        CollectionI18nId id = new CollectionI18nId();
        id.setCollectionId(collectionId);
        id.setLang(language.getValue());
        return id;
    }

    private <T extends EntityI18n, ID extends EmbeddableId> String translatedName(
            JpaRepository<T, ID> repository,
            ID id,
            String fallback
    ) {
        return repository.findById(id)
                .map(EntityI18n::getName)
                .orElse(fallback);
    }
}
