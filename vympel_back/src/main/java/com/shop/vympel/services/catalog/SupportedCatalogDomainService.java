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

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resolves the brand -> country catalog domain from the database.
 * Brands are managed from the CRM; each active brand owns exactly one active country.
 */
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

        Brand brand = brandRepository.findById(brandId)
                .filter(candidate -> Boolean.TRUE.equals(candidate.getActive()))
                .orElseThrow(this::unsupportedBrand);

        List<BrandCountry> mappings = brandCountryRepository.findByBrand(brand);
        if (mappings.size() != 1) {
            throw invalidDomain("Brand must have exactly one country: " + brand.getName());
        }

        Country country = countryRepository.findById(mappings.get(0).getId().getCountryId())
                .filter(candidate -> Boolean.TRUE.equals(candidate.getActive()))
                .orElseThrow(() -> invalidDomain("Mapped country is missing for brand: " + brand.getName()));

        if (submittedCountryId != null && !country.getId().equals(submittedCountryId)) {
            throw new BusinessRuleViolationException(
                    "BRAND_COUNTRY_MISMATCH",
                    "Production country must match the selected brand."
            );
        }

        return new Assignment(brand, country);
    }

    @Transactional(readOnly = true)
    public List<Assignment> assignments() {
        Map<Long, Country> countries = countryRepository.findAll().stream()
                .filter(country -> Boolean.TRUE.equals(country.getActive()))
                .collect(Collectors.toMap(Country::getId, country -> country));

        return brandRepository.findAll().stream()
                .filter(brand -> Boolean.TRUE.equals(brand.getActive()))
                .sorted(Comparator.comparing(Brand::getId))
                .map(brand -> {
                    List<BrandCountry> mappings = brandCountryRepository.findByBrand(brand);
                    if (mappings.size() != 1) {
                        throw invalidDomain("Brand must have exactly one country: " + brand.getName());
                    }
                    Country country = countries.get(mappings.get(0).getId().getCountryId());
                    if (country == null) {
                        throw invalidDomain("Mapped country is missing for brand: " + brand.getName());
                    }
                    return new Assignment(brand, country);
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

    /** Countries that own at least one brand, in brand order. */
    @Transactional(readOnly = true)
    public List<Country> countries() {
        Map<Long, Country> countries = new LinkedHashMap<>();
        assignments().forEach(assignment -> countries.putIfAbsent(assignment.country().getId(), assignment.country()));
        return List.copyOf(countries.values());
    }

    /**
     * Every active country, including ones whose brands were deleted, so the CRM can bind new brands to them.
     * Brand-owned countries come first in brand order.
     */
    @Transactional(readOnly = true)
    public List<Country> selectableCountries() {
        Map<Long, Country> countries = new LinkedHashMap<>();
        countries().forEach(country -> countries.put(country.getId(), country));
        countryRepository.findAll().stream()
                .filter(country -> Boolean.TRUE.equals(country.getActive()))
                .sorted(Comparator.comparing(Country::getId))
                .forEach(country -> countries.putIfAbsent(country.getId(), country));
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

    public record Assignment(Brand brand, Country country) {
    }
}
