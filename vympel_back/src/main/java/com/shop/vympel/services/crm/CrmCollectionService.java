package com.shop.vympel.services.crm;

import com.shop.vympel.db.entity.features.Brand;
import com.shop.vympel.db.entity.features.Collection;
import com.shop.vympel.db.entity.i18n.CollectionI18n;
import com.shop.vympel.db.entity.i18n.CollectionI18nId;
import com.shop.vympel.db.repositories.product.features.BrandRepository;
import com.shop.vympel.db.repositories.product.features.CollectionI18nRepository;
import com.shop.vympel.db.repositories.product.features.CollectionRepository;
import com.shop.vympel.dtos.crm.CrmCollectionCreateRequest;
import com.shop.vympel.dtos.crm.CrmCollectionResponse;
import com.shop.vympel.dtos.crm.CrmCollectionTranslationRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CrmCollectionService {
    private final BrandRepository brandRepository;
    private final CollectionRepository collectionRepository;
    private final CollectionI18nRepository collectionI18nRepository;

    @Transactional(readOnly = true)
    public List<CrmCollectionResponse> getAll(Language language) {
        return collectionRepository.findAll()
                .stream()
                .map(collection -> toResponse(collection, language))
                .sorted(Comparator.comparing(CrmCollectionResponse::name))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CrmCollectionResponse> getByBrand(Long brandId, Language language) {
        return collectionRepository.findAllByBrand_Id(brandId)
                .stream()
                .map(collection -> toResponse(collection, language))
                .sorted(Comparator.comparing(CrmCollectionResponse::name))
                .toList();
    }

    @Transactional
    public CrmCollectionResponse create(CrmCollectionCreateRequest request, Language language) {
        Brand brand = brandRepository.findById(request.brandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found"));

        String code = generateCode(request.translations().en().name());
        collectionRepository.findByBrand_IdAndCode(brand.getId(), code)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Collection with code " + code + " already exists");
                });

        Collection collection = new Collection();
        collection.setBrand(brand);
        collection.setCode(code);
        collection.setName(clean(request.translations().ru().name()));
        collection.setActive(true);
        Collection savedCollection = collectionRepository.save(collection);

        saveTranslation(savedCollection, Language.RU, request.translations().ru());
        saveTranslation(savedCollection, Language.EN, request.translations().en());
        saveTranslation(savedCollection, Language.KZ, request.translations().kz());

        return toResponse(savedCollection, language);
    }

    public CrmCollectionResponse toResponse(Collection collection, Language language) {
        CollectionI18n translation = findTranslation(collection, language);
        Brand brand = collection.getBrand();
        String legacyName = collection.getName() == null || collection.getName().isBlank()
                ? collection.getCode()
                : collection.getName();

        return new CrmCollectionResponse(
                collection.getId(),
                brand == null ? null : brand.getId(),
                brand == null ? null : firstNonBlank(brand.getName(), brand.getCode()),
                collection.getCode(),
                translation == null ? legacyName : translation.getName(),
                translation == null ? "" : translation.getDescription(),
                collection.getActive(),
                collection.getCreatedAt(),
                collection.getUpdatedAt()
        );
    }

    private CollectionI18n findTranslation(Collection collection, Language language) {
        return collectionI18nRepository.findById(id(collection.getId(), language))
                .or(() -> collectionI18nRepository.findById(id(collection.getId(), Language.RU)))
                .orElse(null);
    }

    private void saveTranslation(Collection collection, Language language, CrmCollectionTranslationRequest translation) {
        CollectionI18n entity = new CollectionI18n();
        entity.setId(id(collection.getId(), language));
        entity.setCollection(collection);
        entity.setName(clean(translation.name()));
        entity.setDescription(clean(translation.description()));

        collectionI18nRepository.save(entity);
    }

    private CollectionI18nId id(Long collectionId, Language language) {
        CollectionI18nId id = new CollectionI18nId();
        id.setCollectionId(collectionId);
        id.setLang(language.getValue());
        return id;
    }

    private String generateCode(String name) {
        String normalized = Normalizer.normalize(clean(name), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase()
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");

        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Collection EN name must contain latin letters or numbers");
        }

        return normalized.length() > 100 ? normalized.substring(0, 100) : normalized;
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String firstNonBlank(String primary, String fallback) {
        return primary == null || primary.isBlank() ? fallback : primary;
    }
}
