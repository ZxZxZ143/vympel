package com.shop.vympel.services.catalog;

import com.shop.vympel.db.entity.features.Brand;
import com.shop.vympel.db.entity.features.BrandCountry;
import com.shop.vympel.db.entity.features.BrandCountryId;
import com.shop.vympel.db.entity.features.Country;
import com.shop.vympel.db.repositories.CountryRepository;
import com.shop.vympel.db.repositories.product.features.BrandCountryRepository;
import com.shop.vympel.db.repositories.product.features.BrandRepository;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupportedCatalogDomainServiceTest {
    @Mock BrandRepository brandRepository;
    @Mock BrandCountryRepository brandCountryRepository;
    @Mock CountryRepository countryRepository;

    private SupportedCatalogDomainService service;
    private Brand romanson;
    private Country southKorea;

    @BeforeEach
    void setUp() {
        service = new SupportedCatalogDomainService(brandRepository, brandCountryRepository, countryRepository);
        romanson = brand(1L, "romanson", "Romanson");
        southKorea = country(2L, "south-korea", "KR");
    }

    @Test
    void resolvesTheCanonicalCountryForASupportedBrand() {
        stubMapping(romanson, southKorea);

        SupportedCatalogDomainService.Assignment assignment = service.requireAssignment(1L, 2L);

        assertThat(assignment.definition()).isEqualTo(SupportedBrandCountry.ROMANSON);
        assertThat(assignment.brand()).isSameAs(romanson);
        assertThat(assignment.country()).isSameAs(southKorea);
    }

    @Test
    void rejectsAnUnsupportedBrandWithAStableErrorCode() {
        when(brandRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireAssignment(99L, null))
                .isInstanceOfSatisfying(BusinessRuleViolationException.class, error ->
                        assertThat(error.getCode()).isEqualTo("UNSUPPORTED_BRAND"));
    }

    @Test
    void rejectsACountryThatDoesNotMatchTheBrand() {
        stubMapping(romanson, southKorea);

        assertThatThrownBy(() -> service.requireAssignment(1L, 999L))
                .isInstanceOfSatisfying(BusinessRuleViolationException.class, error -> {
                    assertThat(error.getCode()).isEqualTo("BRAND_COUNTRY_MISMATCH");
                    assertThat(error.getMessage()).contains("must match");
                });
    }

    @Test
    void rejectsMultipleCountryMappingsForOneBrand() {
        when(brandRepository.findById(1L)).thenReturn(Optional.of(romanson));
        when(brandCountryRepository.findByBrand(romanson)).thenReturn(List.of(
                mapping(romanson, 2L),
                mapping(romanson, 3L)
        ));

        assertThatThrownBy(() -> service.requireAssignment(1L, null))
                .isInstanceOfSatisfying(BusinessRuleViolationException.class, error ->
                        assertThat(error.getCode()).isEqualTo("CATALOG_DOMAIN_INVALID"));
    }

    private void stubMapping(Brand brand, Country country) {
        when(brandRepository.findById(brand.getId())).thenReturn(Optional.of(brand));
        when(brandCountryRepository.findByBrand(brand)).thenReturn(List.of(mapping(brand, country.getId())));
        when(countryRepository.findById(country.getId())).thenReturn(Optional.of(country));
    }

    private BrandCountry mapping(Brand brand, Long countryId) {
        BrandCountryId id = new BrandCountryId();
        id.setBrandId(brand.getId());
        id.setCountryId(countryId);
        BrandCountry mapping = new BrandCountry();
        mapping.setId(id);
        mapping.setBrand(brand);
        return mapping;
    }

    private Brand brand(Long id, String code, String name) {
        Brand brand = new Brand();
        brand.setId(id);
        brand.setCode(code);
        brand.setName(name);
        brand.setActive(true);
        return brand;
    }

    private Country country(Long id, String code, String iso2) {
        Country country = new Country();
        country.setId(id);
        country.setCode(code);
        country.setIso2(iso2);
        country.setActive(true);
        return country;
    }
}
