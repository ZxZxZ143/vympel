package com.shop.vympel.services.crm;

import com.shop.vympel.dtos.crm.CrmReferenceCreateRequest;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CrmReferenceMutationService {
    private static final int MAX_NAME_LENGTH = 100;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public CrmReferenceOptionResponse create(
            String rawType,
            CrmReferenceCreateRequest request,
            Language responseLanguage
    ) {
        ReferenceType type = ReferenceType.fromPath(rawType);
        Map<String, String> translations = translations(request);
        List<String> normalizedNames = translations.values().stream()
                .map(CrmReferenceMutationService::normalize)
                .distinct()
                .sorted()
                .toList();

        for (String normalizedName : normalizedNames) {
            jdbcTemplate.query(
                    "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))",
                    statement -> statement.setString(1, type.duplicateScope + "|" + normalizedName),
                    resultSet -> null
            );
        }

        rejectDuplicate(type, normalizedNames);

        String code = generateCode(type, translations);
        Long id = insertReference(type, code);
        insertTranslations(type, id, translations);

        String responseName = switch (responseLanguage) {
            case EN -> translations.get("en");
            case KZ -> translations.get("kk");
            case RU -> translations.get("ru");
        };
        return new CrmReferenceOptionResponse(id, responseName, code);
    }

    static String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replace('ё', 'е')
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private Map<String, String> translations(CrmReferenceCreateRequest request) {
        String ru = cleanName(request.ru());
        String kz = cleanOptionalName(request.kz(), ru);
        String en = cleanOptionalName(request.en(), ru);
        if (List.of(ru, kz, en).stream().map(CrmReferenceMutationService::normalize).anyMatch(String::isBlank)) {
            throw new IllegalArgumentException("Reference name must contain at least one letter or digit");
        }
        Map<String, String> translations = new LinkedHashMap<>();
        translations.put("ru", ru);
        translations.put("kk", kz);
        translations.put("en", en);
        return translations;
    }

    private String cleanOptionalName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : cleanName(value);
    }

    private String cleanName(String value) {
        String clean = value == null ? "" : value.replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
        if (clean.isBlank() || clean.length() > MAX_NAME_LENGTH) {
            throw new IllegalArgumentException("Reference name must contain 1 to 100 characters");
        }
        if (clean.indexOf('<') >= 0 || clean.indexOf('>') >= 0 || clean.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Reference name contains unsupported characters");
        }
        return clean;
    }

    private void rejectDuplicate(ReferenceType type, List<String> requestedNames) {
        String sql = "SELECT base.id, translation.name FROM " + type.table + " base "
                + "JOIN " + type.i18nTable + " translation ON translation." + type.i18nIdColumn + " = base.id "
                + type.whereClause();
        List<ExistingName> existingNames = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new ExistingName(rs.getLong("id"), rs.getString("name")),
                type.whereArguments()
        );
        boolean duplicate = existingNames.stream()
                .map(ExistingName::name)
                .map(CrmReferenceMutationService::normalize)
                .anyMatch(requestedNames::contains);
        if (duplicate) {
            throw new BusinessRuleViolationException(
                    "REFERENCE_DUPLICATE",
                    "A reference value with the same normalized name already exists."
            );
        }
    }

    private Long insertReference(ReferenceType type, String code) {
        if (type == ReferenceType.MATERIAL_CASE || type == ReferenceType.MATERIAL_STRAP) {
            return jdbcTemplate.queryForObject(
                    "INSERT INTO material (code, material_group, active) VALUES (?, ?, true) RETURNING id",
                    Long.class,
                    code,
                    type == ReferenceType.MATERIAL_CASE ? "CASE" : "STRAP"
            );
        }
        if (type.discriminatorColumn != null) {
            return jdbcTemplate.queryForObject(
                    "INSERT INTO " + type.table + " (" + type.discriminatorColumn + ", code, active) "
                            + "VALUES (?, ?, true) RETURNING id",
                    Long.class,
                    type.discriminatorValue,
                    code
            );
        }
        return jdbcTemplate.queryForObject(
                "INSERT INTO " + type.table + " (code, active) VALUES (?, true) RETURNING id",
                Long.class,
                code
        );
    }

    private void insertTranslations(ReferenceType type, Long id, Map<String, String> translations) {
        List<Object[]> batches = new ArrayList<>();
        translations.forEach((language, name) -> {
            if (type == ReferenceType.WATCH_DIAL_TYPE
                    || type == ReferenceType.WATCH_DIAL_MARKING
                    || type == ReferenceType.WATCH_POWER_SOURCE
                    || type == ReferenceType.WATCH_WATER_RESISTANCE) {
                batches.add(new Object[]{id, type.discriminatorValue, language, name, normalize(name)});
            } else if (type == ReferenceType.WATCH_FEATURE) {
                batches.add(new Object[]{id, language, name, null});
            } else {
                batches.add(new Object[]{id, language, name});
            }
        });

        if (type == ReferenceType.WATCH_DIAL_TYPE
                || type == ReferenceType.WATCH_DIAL_MARKING
                || type == ReferenceType.WATCH_POWER_SOURCE
                || type == ReferenceType.WATCH_WATER_RESISTANCE) {
            jdbcTemplate.batchUpdate(
                    "INSERT INTO watch_attribute_option_i18n "
                            + "(option_id, option_type, lang, name, normalized_name) VALUES (?, ?, ?, ?, ?)",
                    batches
            );
            return;
        }
        if (type == ReferenceType.WATCH_FEATURE) {
            jdbcTemplate.batchUpdate(
                    "INSERT INTO watch_feature_i18n (feature_id, lang, name, description) VALUES (?, ?, ?, ?)",
                    batches
            );
            return;
        }
        jdbcTemplate.batchUpdate(
                "INSERT INTO " + type.i18nTable + " (" + type.i18nIdColumn + ", lang, name) VALUES (?, ?, ?)",
                batches
        );
    }

    private String generateCode(ReferenceType type, Map<String, String> translations) {
        String source = type.duplicateScope + "|" + translations.values().stream()
                .map(CrmReferenceMutationService::normalize)
                .sorted(Comparator.naturalOrder())
                .reduce((left, right) -> left + "|" + right)
                .orElseThrow();
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(source.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (int index = 0; index < 8; index++) {
                hash.append(String.format("%02X", digest[index]));
            }
            return "CRM_" + hash;
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private record ExistingName(Long id, String name) {
    }

    private enum ReferenceType {
        WATCH_MECHANISM("watch-mechanisms", "watch_mechanism", "watch_mechanism_i18n", "mechanism_id", null, null, "WATCH_MECHANISM"),
        GENDER("genders", "gender", "gender_i18n", "gender_id", null, null, "GENDER"),
        MATERIAL_CASE("case-materials", "material", "material_i18n", "material_id", null, null, "MATERIAL"),
        MATERIAL_STRAP("strap-materials", "material", "material_i18n", "material_id", null, null, "MATERIAL"),
        GLASS_TYPE("glass-types", "glass_type", "glass_type_i18n", "glass_type_id", null, null, "GLASS_TYPE"),
        STONE_INLAY("stone-inlays", "stone_inlay", "stone_inlay_i18n", "stone_inlay_id", null, null, "STONE_INLAY"),
        COLOR("colors", "interior_feature", "interior_feature_i18n", "feature_id", "feature_type", "COLOR", "COLOR"),
        INTERIOR_STYLE("interior-styles", "interior_feature", "interior_feature_i18n", "feature_id", "feature_type", "STYLE", "INTERIOR_STYLE"),
        INTERIOR_MECHANISM("interior-mechanisms", "interior_feature", "interior_feature_i18n", "feature_id", "feature_type", "MECHANISM", "INTERIOR_MECHANISM"),
        INTERIOR_POWER("interior-power-types", "interior_feature", "interior_feature_i18n", "feature_id", "feature_type", "POWER", "INTERIOR_POWER"),
        WATCH_DIAL_TYPE("watch-dial-types", "watch_attribute_option", "watch_attribute_option_i18n", "option_id", "option_type", "DIAL_TYPE", "WATCH_DIAL_TYPE"),
        WATCH_DIAL_MARKING("watch-dial-markings", "watch_attribute_option", "watch_attribute_option_i18n", "option_id", "option_type", "DIAL_MARKING", "WATCH_DIAL_MARKING"),
        WATCH_POWER_SOURCE("watch-power-sources", "watch_attribute_option", "watch_attribute_option_i18n", "option_id", "option_type", "POWER_SOURCE", "WATCH_POWER_SOURCE"),
        WATCH_WATER_RESISTANCE("watch-water-resistances", "watch_attribute_option", "watch_attribute_option_i18n", "option_id", "option_type", "WATER_RESISTANCE", "WATCH_WATER_RESISTANCE"),
        WATCH_FEATURE("watch-features", "watch_feature", "watch_feature_i18n", "feature_id", null, null, "WATCH_FEATURE");

        private final String path;
        private final String table;
        private final String i18nTable;
        private final String i18nIdColumn;
        private final String discriminatorColumn;
        private final String discriminatorValue;
        private final String duplicateScope;

        ReferenceType(
                String path,
                String table,
                String i18nTable,
                String i18nIdColumn,
                String discriminatorColumn,
                String discriminatorValue,
                String duplicateScope
        ) {
            this.path = path;
            this.table = table;
            this.i18nTable = i18nTable;
            this.i18nIdColumn = i18nIdColumn;
            this.discriminatorColumn = discriminatorColumn;
            this.discriminatorValue = discriminatorValue;
            this.duplicateScope = duplicateScope;
        }

        private static ReferenceType fromPath(String path) {
            for (ReferenceType type : values()) {
                if (type.path.equals(path)) return type;
            }
            throw new IllegalArgumentException("Unsupported reference type");
        }

        private String whereClause() {
            if (discriminatorColumn == null) return "";
            return " WHERE base." + discriminatorColumn + " = ?";
        }

        private Object[] whereArguments() {
            return discriminatorColumn == null ? new Object[0] : new Object[]{discriminatorValue};
        }
    }
}
