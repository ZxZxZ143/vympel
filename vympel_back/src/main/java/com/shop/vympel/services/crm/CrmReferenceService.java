package com.shop.vympel.services.crm;

import com.shop.vympel.db.entity.features.*;
import com.shop.vympel.db.entity.i18n.*;
import com.shop.vympel.db.repositories.product.features.*;
import com.shop.vympel.db.repositories.product.watchDetail.WatchMechanismRepository;
import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.category.CategoryService;
import com.shop.vympel.services.catalog.SupportedCatalogDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class CrmReferenceService {
    private final CategoryService categoryService;
    private final SupportedCatalogDomainService supportedCatalogDomainService;
    private final CollectionRepository collectionRepository;
    private final WatchMechanismRepository watchMechanismRepository;
    private final GenderRepository genderRepository;
    private final MaterialRepository materialRepository;
    private final GlassTypeRepository glassTypeRepository;
    private final StoneInlayRepository stoneInlayRepository;
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
        List<Collection> collections = collectionRepository.findAllWithBrand();
        List<WatchMechanism> mechanisms = watchMechanismRepository.findAll();
        List<Gender> genders = genderRepository.findAll();
        List<Material> materials = materialRepository.findAll();
        List<GlassType> glassTypes = glassTypeRepository.findAll();
        List<StoneInlay> stoneInlays = stoneInlayRepository.findAll();
        List<Country> countries = supportedCatalogDomainService.countries();
        List<InteriorFeature> colors = interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("COLOR");
        List<InteriorFeature> styles = interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("STYLE");
        List<InteriorFeature> interiorMechanisms = interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("MECHANISM");
        List<InteriorFeature> powerSources = interiorFeatureRepository.findByFeatureTypeAndActiveTrueOrderByCodeAsc("POWER");
        List<InteriorFeature> allInteriorFeatures = new ArrayList<>();
        allInteriorFeatures.addAll(colors);
        allInteriorFeatures.addAll(styles);
        allInteriorFeatures.addAll(interiorMechanisms);
        allInteriorFeatures.addAll(powerSources);

        Map<Long, String> collectionNames = translatedNames(
                collectionI18nRepository, collections, Collection::getId, language,
                CollectionI18nId::new, CollectionI18n::getId
        );
        Map<Long, String> mechanismNames = translatedNames(
                mechanismI18nRepository, mechanisms, WatchMechanism::getId, language,
                WatchMechanismI18nId::new, WatchMechanismI18n::getId
        );
        Map<Long, String> genderNames = translatedNames(
                genderI18nRepository, genders, Gender::getId, language,
                GenderI18nId::new, GenderI18n::getId
        );
        Map<Long, String> materialNames = translatedNames(
                materialI18nRepository, materials, Material::getId, language,
                MaterialI18nId::new, MaterialI18n::getId
        );
        Map<Long, String> glassTypeNames = translatedNames(
                glassTypeI18nRepository, glassTypes, GlassType::getId, language,
                GlassTypeI18nId::new, GlassTypeI18n::getId
        );
        Map<Long, String> stoneInlayNames = translatedNames(
                stoneInlayI18nRepository, stoneInlays, StoneInlay::getId, language,
                StoneInlayI18nId::new, StoneInlayI18n::getId
        );
        Map<Long, String> interiorNames = translatedNames(
                interiorFeatureI18nRepository, allInteriorFeatures, InteriorFeature::getId,
                language, InteriorFeatureI18nId::new, InteriorFeatureI18n::getId
        );
        Map<Long, String> countryNames = countryNames(countries, language);

        return new CrmReferencesResponse(
                categoryService.getAll(language),
                supportedCatalogDomainService.assignments()
                        .stream()
                        .map(assignment -> new CrmBrandReferenceOptionResponse(
                                assignment.brand().getId(),
                                assignment.definition().brandName(),
                                assignment.definition().brandCode(),
                                assignment.country().getId(),
                                assignment.country().getCode(),
                                countryNames.getOrDefault(assignment.country().getId(), assignment.country().getCode())
                        ))
                        .sorted(Comparator.comparing(CrmBrandReferenceOptionResponse::name))
                        .toList(),
                collections.stream()
                        .map(collection -> option(
                                collection.getId(),
                                collectionNames.getOrDefault(
                                        collection.getId(),
                                        fallbackName(collection.getName(), collection.getCode())
                                ),
                                collection.getCode(),
                                collection.getBrand() == null ? null : collection.getBrand().getId()
                        ))
                        .sorted(Comparator.comparing(CrmReferenceOptionResponse::name))
                        .toList(),
                mapCodedOptions(mechanisms, WatchMechanism::getId, WatchMechanism::getCode,
                        mechanism -> mechanismNames.getOrDefault(mechanism.getId(), mechanism.getCode())),
                mapCodedOptions(genders, Gender::getId, Gender::getCode,
                        gender -> genderNames.getOrDefault(gender.getId(), gender.getCode())),
                mapCodedOptions(materials, Material::getId, Material::getCode,
                        material -> materialNames.getOrDefault(material.getId(), material.getCode())),
                mapCodedOptions(glassTypes, GlassType::getId, GlassType::getCode,
                        glass -> glassTypeNames.getOrDefault(glass.getId(), glass.getCode())),
                mapCodedOptions(stoneInlays, StoneInlay::getId, StoneInlay::getCode,
                        stone -> stoneInlayNames.getOrDefault(stone.getId(), stone.getCode())),
                mapCodedOptions(countries, Country::getId, Country::getCode,
                        country -> countryNames.getOrDefault(country.getId(), country.getCode())),
                mapCodedOptions(colors, InteriorFeature::getId, InteriorFeature::getCode,
                        feature -> interiorNames.getOrDefault(feature.getId(), feature.getCode())),
                mapCodedOptions(styles, InteriorFeature::getId, InteriorFeature::getCode,
                        feature -> interiorNames.getOrDefault(feature.getId(), feature.getCode())),
                mapCodedOptions(interiorMechanisms, InteriorFeature::getId, InteriorFeature::getCode,
                        feature -> interiorNames.getOrDefault(feature.getId(), feature.getCode())),
                mapCodedOptions(powerSources, InteriorFeature::getId, InteriorFeature::getCode,
                        feature -> interiorNames.getOrDefault(feature.getId(), feature.getCode()))
        );
    }

    private <R, T extends EntityI18n, ID extends EmbeddableId> Map<Long, String> translatedNames(
            JpaRepository<T, ID> repository,
            List<R> references,
            Function<R, Long> idGetter,
            Language language,
            Supplier<ID> idFactory,
            Function<T, ID> translationIdGetter
    ) {
        if (references.isEmpty()) {
            return Map.of();
        }
        List<String> languages = Language.RU == language
                ? List.of(Language.RU.getValue())
                : List.of(language.getValue(), Language.RU.getValue());
        List<ID> ids = new ArrayList<>();
        for (R reference : references) {
            for (String lang : languages) {
                ID id = idFactory.get();
                id.setId(idGetter.apply(reference));
                id.setLang(lang);
                ids.add(id);
            }
        }
        Map<Long, String> names = new LinkedHashMap<>();
        repository.findAllById(ids).stream()
                .sorted((left, right) -> Boolean.compare(
                        language.getValue().equals(translationIdGetter.apply(right).getLang()),
                        language.getValue().equals(translationIdGetter.apply(left).getLang())
                ))
                .forEach(value -> names.putIfAbsent(translationIdGetter.apply(value).getId(), value.getName()));
        return names;
    }

    private Map<Long, String> countryNames(List<Country> countries, Language language) {
        if (countries.isEmpty()) {
            return Map.of();
        }
        List<String> languages = Language.RU == language
                ? List.of(Language.RU.getValue())
                : List.of(language.getValue(), Language.RU.getValue());
        List<CountryI18nId> ids = new ArrayList<>();
        for (Country country : countries) {
            for (String lang : languages) {
                CountryI18nId id = new CountryI18nId();
                id.setCountryId(country.getId());
                id.setLang(lang);
                ids.add(id);
            }
        }
        Map<Long, String> names = new LinkedHashMap<>();
        countryI18nRepository.findAllById(ids).stream()
                .sorted((left, right) -> Boolean.compare(
                        language.getValue().equals(right.getId().getLang()),
                        language.getValue().equals(left.getId().getLang())
                ))
                .forEach(value -> names.putIfAbsent(value.getId().getCountryId(), value.getName()));
        return names;
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
}
