package com.shop.vympel.services.catalog;

import com.shop.vympel.db.entity.features.Brand;
import com.shop.vympel.db.entity.features.BrandCountry;
import com.shop.vympel.db.entity.features.Country;
import com.shop.vympel.db.repositories.CountryRepository;
import com.shop.vympel.db.repositories.product.features.BrandCountryRepository;
import com.shop.vympel.db.repositories.product.features.BrandRepository;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportedCatalogDomainService {
    private final BrandRepository brandRepository;
    private final BrandCountryRepository brandCountryRepository;
    private final CountryRepository countryRepository;

    @Transactional(readOnly = true)
    public Assignment requireAssignment(Long brandId, Long submittedCountryId) {
        if (brandId == null) {
            throw unsupportedBrand();
        }

        Brand brand = brandRepository.findById(brandId).orElseThrow(this::unsupportedBrand);
        SupportedBrandCountry definition = SupportedBrandCountry.fromBrandCode(brand.getCode())
                .filter(candidate -> candidate.brandName().equals(brand.getName()))
                .filter(candidate -> Boolean.TRUE.equals(brand.getActive()))
                .orElseThrow(this::unsupportedBrand);

        List<BrandCountry> mappings = brandCountryRepository.findByBrand(brand);
        if (mappings.size() != 1) {
            throw invalidDomain("Brand must have exactly one supported country: " + definition.brandName());
        }

        Country country = countryRepository.findById(mappings.get(0).getId().getCountryId())
                .orElseThrow(() -> invalidDomain("Mapped country is missing for brand: " + definition.brandName()));
        if (!Boolean.TRUE.equals(country.getActive()) || !definition.countryIso2().equals(country.getIso2())) {
            throw invalidDomain("Brand country mapping is invalid for brand: " + definition.brandName());
        }

        if (submittedCountryId != null && !country.getId().equals(submittedCountryId)) {
            throw new BusinessRuleViolationException(
                    "BRAND_COUNTRY_MISMATCH",
                    "Production country must match the selected brand."
            );
        }

        return new Assignment(definition, brand, country);
    }

    @Transactional(readOnly = true)
    public List<Assignment> assignments() {
        Map<String, Brand> brandsByCode = brandRepository.findAll().stream()
                .collect(Collectors.toMap(Brand::getCode, brand -> brand));

        return Arrays.stream(SupportedBrandCountry.values())
                .map(definition -> {
                    Brand brand = brandsByCode.get(definition.brandCode());
                    if (brand == null) {
                        throw invalidDomain("Supported brand is missing: " + definition.brandName());
                    }
                    return requireAssignment(brand.getId(), null);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Set<Long> supportedBrandIds() {
        return assignments().stream().map(assignment -> assignment.brand().getId()).collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public Set<Long> supportedCountryIds() {
        return assignments().stream().map(assignment -> assignment.country().getId()).collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public List<Country> countries() {
        Map<Long, Country> countries = new LinkedHashMap<>();
        assignments().forEach(assignment -> countries.putIfAbsent(assignment.country().getId(), assignment.country()));
        return List.copyOf(countries.values());
    }

    private BusinessRuleViolationException unsupportedBrand() {
        return new BusinessRuleViolationException(
                "UNSUPPORTED_BRAND",
                "Brand is not supported by the catalog."
        );
    }

    private BusinessRuleViolationException invalidDomain(String message) {
        return new BusinessRuleViolationException("CATALOG_DOMAIN_INVALID", message);
    }

    public record Assignment(SupportedBrandCountry definition, Brand brand, Country country) {
    }
}
