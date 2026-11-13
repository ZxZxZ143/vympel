package com.shop.vympel.services.crm;

import com.shop.vympel.dtos.crm.CrmBrandCreateRequest;
import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmCountryCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CrmBrandService {
    private static final int MAX_CODE_LENGTH = 100;
    /** Brands with a storefront landing page (vympel_front/src/config/brandRoutes.ts PUBLIC_BRANDS). */
    private static final Set<String> STOREFRONT_BRAND_CODES = Set.of(
            "romanson", "adriatica", "appella", "pierre-ricaud", "rhythm", "royal-london");
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public CrmBrandReferenceOptionResponse create(CrmBrandCreateRequest request, Language language) {
        String name = collapseSpaces(request.name());
        String code = slug(name);
        if (code.isEmpty()) {
            throw new BusinessRuleViolationException(
                    "BRAND_NAME_INVALID", "Brand name must contain latin letters or digits.");
        }

        lock("brand|" + code);
        lock("brand-name|" + name.toLowerCase(Locale.ROOT));
        Long duplicates = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM brand WHERE code = ? OR lower(name) = lower(?)", Long.class, code, name);
        if (duplicates != null && duplicates > 0) {
            throw new BusinessRuleViolationException("BRAND_EXISTS", "Brand already exists.");
        }

        Long countryId = request.newCountry() == null
                ? requireExistingCountry(request.countryId())
                : createCountry(request.newCountry());

        Long brandId = jdbcTemplate.queryForObject(
                "INSERT INTO brand(code, name, active) VALUES (?, ?, true) RETURNING id", Long.class, code, name);
        jdbcTemplate.update("INSERT INTO brand_country(brand_id, country_id) VALUES (?, ?)", brandId, countryId);

        String countryCode = jdbcTemplate.queryForObject("SELECT code FROM country WHERE id = ?", String.class, countryId);
        return new CrmBrandReferenceOptionResponse(
                brandId, name, code, countryId, countryCode, countryName(countryId, language, countryCode),
                isDeletable(code));
    }

    /**
     * Permanently deletes an unused brand together with its country mapping and its (unused) collections.
     * The country itself is kept so it stays selectable for future brands.
     */
    @Transactional
    public DeletedBrand delete(Long id) {
        List<String> codes = jdbcTemplate.queryForList("SELECT code FROM brand WHERE id = ? FOR UPDATE", String.class, id);
        if (codes.isEmpty()) {
            throw new ResourceNotFoundException("Brand not found");
        }
        String code = codes.get(0);
        if (!isDeletable(code)) {
            throw new BusinessRuleViolationException(
                    "BRAND_PROTECTED", "Brands with a storefront brand page cannot be deleted.");
        }

        Long products = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM product p WHERE p.brand_id = ? "
                        + "OR p.collection_id IN (SELECT c.id FROM collection c WHERE c.brand_id = ?)",
                Long.class, id, id);
        if (products != null && products > 0) {
            throw new BusinessRuleViolationException(
                    "BRAND_IN_USE", "Brand is used by " + products + " products.");
        }

        Long collections = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM collection WHERE brand_id = ?", Long.class, id);
        jdbcTemplate.update("DELETE FROM brand WHERE id = ?", id);
        return new DeletedBrand(code, collections == null ? 0 : collections);
    }

    public static boolean isDeletable(String brandCode) {
        return brandCode != null && !STOREFRONT_BRAND_CODES.contains(brandCode);
    }

    public record DeletedBrand(String code, long deletedCollections) {
    }

    private Long requireExistingCountry(Long countryId) {
        List<Long> rows = jdbcTemplate.queryForList(
                "SELECT id FROM country WHERE id = ? AND active = true FOR SHARE", Long.class, countryId);
        if (rows.isEmpty()) {
            throw new BusinessRuleViolationException("COUNTRY_NOT_FOUND", "Country not found.");
        }
        return rows.get(0);
    }

    private Long createCountry(CrmCountryCreateRequest request) {
        String iso2 = request.iso2().trim().toUpperCase(Locale.ROOT);
        String nameRu = collapseSpaces(request.nameRu());
        String nameEn = collapseSpaces(request.nameEn());
        String nameKz = collapseSpaces(request.nameKz());
        String code = slug(nameEn);
        if (code.isEmpty()) {
            throw new BusinessRuleViolationException(
                    "COUNTRY_NAME_INVALID", "Country EN name must contain latin letters or digits.");
        }

        lock("country|" + iso2);
        lock("country-code|" + code);
        Long duplicates = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM country WHERE iso2 = ? OR code = ?", Long.class, iso2, code);
        if (duplicates != null && duplicates > 0) {
            throw new BusinessRuleViolationException("COUNTRY_EXISTS", "Country already exists.");
        }

        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO country(code, iso2, active) VALUES (?, ?, true) RETURNING id", Long.class, code, iso2);
        jdbcTemplate.update(
                "INSERT INTO country_i18n(country_id, lang, name) VALUES (?, 'ru', ?), (?, 'en', ?), (?, 'kk', ?)",
                id, nameRu, id, nameEn, id, nameKz);
        return id;
    }

    private String countryName(Long countryId, Language language, String fallback) {
        List<String> names = jdbcTemplate.queryForList(
                "SELECT name FROM country_i18n WHERE country_id = ? AND lang IN (?, 'ru') "
                        + "ORDER BY CASE WHEN lang = ? THEN 0 ELSE 1 END",
                String.class, countryId, language.getValue(), language.getValue());
        return names.isEmpty() ? fallback : names.get(0);
    }

    private void lock(String key) {
        jdbcTemplate.query(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))",
                statement -> statement.setString(1, key),
                resultSet -> null
        );
    }

    static String slug(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (normalized.length() > MAX_CODE_LENGTH) {
            normalized = normalized.substring(0, MAX_CODE_LENGTH).replaceAll("-+$", "");
        }
        return normalized;
    }

    private static String collapseSpaces(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }
}
