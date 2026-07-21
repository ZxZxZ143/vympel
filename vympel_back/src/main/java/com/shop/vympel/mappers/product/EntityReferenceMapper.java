package com.shop.vympel.mappers.product;

import com.shop.vympel.db.entity.features.*;
import com.shop.vympel.db.entity.i18n.*;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.WatchDetail;
import com.shop.vympel.db.repositories.CountryRepository;
import com.shop.vympel.db.repositories.product.features.*;
import com.shop.vympel.db.repositories.product.watchDetail.WatchMechanismRepository;
import com.shop.vympel.dtos.product.features.BrandResponse;
import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.features.FeatureDto;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.mapstruct.Context;
import org.mapstruct.Named;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EntityReferenceMapper {

    private final WatchMechanismRepository mechanismRepository;
    private final GenderRepository genderRepository;
    private final MaterialRepository materialRepository;
    private final GlassTypeRepository glassTypeRepository;
    private final StoneInlayRepository stoneInlayRepository;
    private final BrandRepository brandRepository;
    private final CollectionRepository collectionRepository;
    private final CollectionI18nRepository collectionI18nRepository;
    private final MechanismI18nRepository mechanismI18nRepository;
    private final MaterialI18nRepository materialI18nRepository;
    private final GenderI18nRepository genderI18nRepository;
    private final GlassTypeI18nRepository glassTypeI18nRepository;
    private final StoneInlayI18nRepository stoneInlayI18nRepository;
    private final BrandCountryRepository brandCountryRepository;
    private final CountryRepository countryRepository;
    private final CountryI18nRepository countryI18nRepository;

    @Named("toMechanism")
    public WatchMechanism toMechanism(Long id) {
        return id == null ? null : mechanismRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanism not found: " + id));
    }

    @Named("toGender")
    public Gender toGender(Long id) {
        return id == null ? null : genderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gender not found: " + id));
    }

    @Named("toMaterial")
    public Material toMaterial(Long id) {
        return id == null ? null : materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + id));
    }

    @Named("toGlassType")
    public GlassType toGlassType(Long id) {
        return id == null ? null : glassTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Glass type not found: " + id));
    }

    @Named("toStoneInlay")
    public StoneInlay toStoneInlay(Long id) {
        return id == null ? null : stoneInlayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stone inlay not found: " + id));
    }

    @Named("toBrand")
    public Brand toBrand(Long id) {
        return id == null ? null : brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found: " + id));
    }

    @Named("toCollection")
    public Collection toCollection(Long id) {
        return id == null ? null : collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + id));
    }

    @Named("toMechanismResponse")
    public FeatureDto toMechanismResponse(WatchDetail detail, @Context Language lang) {
        if (detail == null || detail.getMechanism() == null) {
            return null;
        }
        WatchMechanismI18nId watchMechanismI18nId = new WatchMechanismI18nId();
        watchMechanismI18nId.setMechanismId(detail.getMechanism().getId());
        watchMechanismI18nId.setLang(lang.getValue());

        return toFeatureDto(watchMechanismI18nId, mechanismI18nRepository);
    }

    @Named("toGenderResponse")
    public FeatureDto toGenderResponse(WatchDetail detail, @Context Language lang) {
        if (detail == null || detail.getGender() == null) {
            return null;
        }
        GenderI18nId embeddableId = new GenderI18nId();
        embeddableId.setId(detail.getGender().getId());
        embeddableId.setLang(lang.getValue());

        return toFeatureDto(embeddableId, genderI18nRepository);
    }

    @Named("toCaseMaterialResponse")
    public FeatureDto toCaseMaterialResponse(WatchDetail detail, @Context Language lang) {
        if (detail == null || detail.getCaseMaterial() == null) {
            return null;
        }
        MaterialI18nId embeddableId = new MaterialI18nId();
        embeddableId.setId(detail.getCaseMaterial().getId());
        embeddableId.setLang(lang.getValue());
        return toFeatureDto(embeddableId, materialI18nRepository);
    }

    @Named("toStrapMaterialResponse")
    public FeatureDto toStrapMaterialResponse(WatchDetail detail, @Context Language lang) {
        if (detail == null || detail.getStrapMaterial() == null) {
            return null;
        }
        MaterialI18nId embeddableId = new MaterialI18nId();
        embeddableId.setId(detail.getStrapMaterial().getId());
        embeddableId.setLang(lang.getValue());
        return toFeatureDto(embeddableId, materialI18nRepository);
    }

    @Named("toGlassTypeResponse")
    public FeatureDto toGlassTypeResponse(WatchDetail detail, @Context Language lang) {
        if (detail == null || detail.getGlassType() == null) {
            return null;
        }
        GlassTypeI18nId embeddableId = new GlassTypeI18nId();
        embeddableId.setId(detail.getGlassType().getId());
        embeddableId.setLang(lang.getValue());

        return toFeatureDto(embeddableId, glassTypeI18nRepository);
    }

    @Named("toStoneInlayResponse")
    public FeatureDto toStoneInlineResponse(WatchDetail detail, @Context Language lang) {
        if (detail == null || detail.getStoneInlay() == null) {
            return null;
        }
        StoneInlayI18nId embeddableId = new StoneInlayI18nId();
        embeddableId.setId(detail.getStoneInlay().getId());
        embeddableId.setLang(lang.getValue());

        return toFeatureDto(embeddableId, stoneInlayI18nRepository);
    }

    @Named("toBrandResponse")
    public BrandResponse toBrandResponse(Product product, @Context Language lang) {
        Brand brand = product.getBrand();
        List<BrandCountry> brandCountry = brandCountryRepository
                .findByBrand(brand);

        BrandResponse brandResponse = new BrandResponse();

        List<String> countries = brandCountry
                .stream()
                .map(brandCountry1 -> {
                    Long countryId = brandCountry1.getId().getCountryId();
                    Country country = countryRepository
                            .findById(countryId)
                            .orElseThrow(() -> new RuntimeException("Country not found"));
                    CountryI18nId countryI18nId = new CountryI18nId();
                    countryI18nId.setCountryId(countryId);
                    countryI18nId.setLang(lang.getValue());
                    CountryI18n countryI18n = countryI18nRepository
                            .findById(countryI18nId)
                            .orElseThrow(() -> new RuntimeException("CountryI18n not found"));

                    return countryI18n.getName();
                })
                .toList();



        brandResponse.setId(brand.getId());
        brandResponse.setName(brand.getName());
        brandResponse.setCountry(countries);
        return brandResponse;
    }

    @Named("toCollectionResponse")
    public CollectionResponse toCollectionResponse(Product product, @Context Language lang) {
        Collection collection = product.getCollection();
        if (collection == null) {
            return null;
        }

        CollectionResponse response = new CollectionResponse();
        response.setId(collection.getId());
        response.setName(collectionName(collection, lang));
        return response;
    }

    private <T extends EntityI18n, ID extends EmbeddableId> FeatureDto toFeatureDto(
            ID id,
            JpaRepository<T, ID> repository
    ) {
        T entityI18n = repository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Localized feature not found"));

        FeatureDto featureDto = new FeatureDto();
        featureDto.setId(id.getId());
        featureDto.setName(entityI18n.getName());

        return featureDto;
    }

    private String collectionName(Collection collection, Language lang) {
        return collectionI18nRepository.findById(collectionI18nId(collection.getId(), lang))
                .or(() -> collectionI18nRepository.findById(collectionI18nId(collection.getId(), Language.RU)))
                .map(CollectionI18n::getName)
                .orElse(firstNonBlank(collection.getName(), collection.getCode()));
    }

    private CollectionI18nId collectionI18nId(Long collectionId, Language lang) {
        CollectionI18nId id = new CollectionI18nId();
        id.setCollectionId(collectionId);
        id.setLang(lang.getValue());
        return id;
    }

    private String firstNonBlank(String primary, String fallback) {
        return primary == null || primary.isBlank() ? fallback : primary;
    }

}
