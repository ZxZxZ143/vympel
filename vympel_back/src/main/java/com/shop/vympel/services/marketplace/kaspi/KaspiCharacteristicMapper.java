package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class KaspiCharacteristicMapper {
    private static final Pattern NUMBER = Pattern.compile("(-?\\d+(?:[.,]\\d+)?)");
    private static final Map<String, FieldKind> LABELS = labelAliases();
    private static final Map<String, String> MATERIAL_ALIASES = aliases(
            "STAINLESS_STEEL", "нержавеющая сталь", "нерж сталь", "нерж. сталь", "stainless steel",
            "STEEL", "сталь", "стальной", "steel",
            "CERAMIC", "керамика", "керамический", "ceramic",
            "TITANIUM", "титан", "титановый", "titanium",
            "CARBON", "карбон", "карбоновый", "carbon",
            "LEATHER", "кожа", "натуральная кожа", "кожаный", "leather",
            "RUBBER", "каучук", "резина", "резиновый", "rubber",
            "SILICONE", "силикон", "силиконовый", "silicone",
            "METAL", "металл", "металлический", "metal"
    );
    private static final Map<String, String> MECHANISM_ALIASES = aliases(
            "QUARTZ", "кварцевый", "кварцевые", "кварц", "quartz",
            "MECHANICAL", "механический", "механические", "механика", "mechanical",
            "AUTOMATIC", "автоматический", "автоматические", "автоподзавод", "automatic"
    );
    private static final Map<String, String> GENDER_ALIASES = aliases(
            "MEN", "мужские", "мужской", "для мужчин", "men", "male",
            "WOMEN", "женские", "женский", "для женщин", "women", "female",
            "UNISEX", "унисекс", "для всех", "unisex"
    );
    private static final Map<String, String> GLASS_ALIASES = aliases(
            "MINERAL", "минеральное", "минеральный", "mineral",
            "SAPPHIRE", "сапфировое", "сапфировый", "sapphire",
            "PLASTIC", "пластиковое", "пластик", "акрил", "plastic",
            "COMBINED", "комбинированное", "комбинированный", "combined"
    );
    private static final Map<String, String> COLOR_ALIASES = aliases(
            "BLACK", "черный", "черная", "черное", "black",
            "WHITE", "белый", "белая", "белое", "white",
            "GOLD", "золотой", "золотистый", "gold",
            "SILVER", "серебряный", "серебристый", "silver",
            "WOOD", "дерево", "деревянный", "wood"
    );
    private static final Map<String, String> STYLE_ALIASES = aliases(
            "CLASSIC", "классика", "классический", "classic",
            "MODERN", "модерн", "современный", "modern",
            "LOFT", "лофт", "loft",
            "MINIMALISM", "минимализм", "minimalism"
    );
    private static final Map<String, String> POWER_ALIASES = aliases(
            "BATTERY", "батарейка", "батарея", "от батарейки", "battery",
            "MAINS", "от сети", "сеть", "mains",
            "MECHANICAL", "механический завод", "механический", "mechanical wind"
    );

    public KaspiProductImportResponse map(
            KaspiParsedProduct parsed,
            String sourceUrl,
            Long categoryId,
            CatalogCategoryProfile profile,
            CrmReferencesResponse references
    ) {
        List<KaspiProductImportResponse.MappedField> mappedFields = new ArrayList<>();
        List<KaspiProductImportResponse.UnmappedCharacteristic> unmapped = new ArrayList<>();
        List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved = new ArrayList<>();
        Set<String> warnings = new LinkedHashSet<>(parsed.warnings());
        Map<String, Candidate> candidates = new LinkedHashMap<>();
        Set<String> conflictedTargets = new HashSet<>();

        String name = clean(parsed.name());
        if (name == null) {
            warnings.add("NAME_NOT_FOUND");
        } else if (name.length() > 255) {
            unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                    "Название", name, "nameRu", "INVALID_VALUE"
            ));
            name = null;
        } else {
            mappedFields.add(new KaspiProductImportResponse.MappedField("nameRu", name));
        }

        Long brandId = null;
        Option brandOption = null;
        String brand = clean(parsed.brand());
        if (brand != null) {
            Resolution brandResolution = resolveBrands(brand, references.brands());
            if (brandResolution.option() != null) {
                brandOption = brandResolution.option();
                brandId = brandOption.id();
                mappedFields.add(new KaspiProductImportResponse.MappedField("brandId", brandOption.name()));
            } else {
                unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                        "Бренд", brand, "brandId", brandResolution.reason()
                ));
                warnings.add("BRAND_UNRESOLVED");
            }
        }

        String model = clean(parsed.model());
        if (model != null && model.length() > 255) {
            unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                    "Модель", model, "model", "INVALID_VALUE"
            ));
            model = null;
        } else if (model != null) {
            mappedFields.add(new KaspiProductImportResponse.MappedField("model", model));
        }
        if (parsed.price() != null) {
            mappedFields.add(new KaspiProductImportResponse.MappedField("price", String.valueOf(parsed.price())));
        }
        String description = clean(parsed.description());
        if (description != null && description.length() > 10_000) {
            unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                    "Описание", description, "descriptionRu", "INVALID_VALUE"
            ));
            description = null;
        } else if (description != null) {
            mappedFields.add(new KaspiProductImportResponse.MappedField("descriptionRu", description));
        }
        mappedFields.add(new KaspiProductImportResponse.MappedField("kaspiUrl", sourceUrl));

        for (KaspiCharacteristic characteristic : parsed.characteristics()) {
            mapCharacteristic(
                    characteristic, profile, references, candidates, conflictedTargets, unmapped, unresolved
            );
        }
        reconcileInteriorCountry(profile, brandOption, references.brands(), candidates, unresolved);

        List<KaspiProductImportResponse.MappedCharacteristic> mappedCharacteristics = candidates.values().stream()
                .map(Candidate::asResponse)
                .toList();

        KaspiProductImportResponse.WatchDetails watch = profile == CatalogCategoryProfile.WRISTWATCH
                ? new KaspiProductImportResponse.WatchDetails(
                longValue(candidates, "watchDetails.mechanismId"),
                longValue(candidates, "watchDetails.genderId"),
                longValue(candidates, "watchDetails.caseMaterialId"),
                longValue(candidates, "watchDetails.strapMaterialId"),
                longValue(candidates, "watchDetails.glassTypeId"),
                integerValue(candidates, "watchDetails.caseSizeMm"),
                stringValue(candidates, "watchDetails.waterResistance"),
                longValue(candidates, "watchDetails.stoneInlayId")
        ) : null;
        KaspiProductImportResponse.InteriorClockDetails interior = profile == CatalogCategoryProfile.INTERIOR_CLOCK
                ? new KaspiProductImportResponse.InteriorClockDetails(
                longValue(candidates, "interiorClockDetails.productionCountryId"),
                longValue(candidates, "interiorClockDetails.caseMaterialId"),
                longValue(candidates, "interiorClockDetails.colorId"),
                longValue(candidates, "interiorClockDetails.styleId"),
                longValue(candidates, "interiorClockDetails.mechanismTypeId"),
                longValue(candidates, "interiorClockDetails.powerTypeId"),
                stringValue(candidates, "interiorClockDetails.dimensions"),
                integerValue(candidates, "interiorClockDetails.weightGrams"),
                integerValue(candidates, "interiorClockDetails.warrantyMonths")
        ) : null;
        KaspiProductImportResponse.AccessoryDetails accessory = profile == CatalogCategoryProfile.ACCESSORY
                ? new KaspiProductImportResponse.AccessoryDetails(
                stringValue(candidates, "accessoryDetails.claspType"),
                longValue(candidates, "accessoryDetails.caseMaterialId"),
                longValue(candidates, "accessoryDetails.insertMaterialId"),
                booleanValue(candidates, "accessoryDetails.hasInsert"),
                longValue(candidates, "accessoryDetails.colorId"),
                stringValue(candidates, "accessoryDetails.length")
        ) : null;

        if (!unmapped.isEmpty()) warnings.add("UNMAPPED_CHARACTERISTICS_PRESENT");
        if (!unresolved.isEmpty()) warnings.add("UNRESOLVED_VALUES_PRESENT");

        return new KaspiProductImportResponse(
                "KASPI",
                sourceUrl,
                categoryId,
                profile,
                new KaspiProductImportResponse.Values(
                        name, brandId, model, parsed.price(), description, sourceUrl, watch, interior, accessory
                ),
                List.copyOf(mappedFields),
                mappedCharacteristics,
                List.copyOf(unmapped),
                List.copyOf(unresolved),
                List.copyOf(warnings)
        );
    }

    private void mapCharacteristic(
            KaspiCharacteristic characteristic,
            CatalogCategoryProfile profile,
            CrmReferencesResponse references,
            Map<String, Candidate> candidates,
            Set<String> conflictedTargets,
            List<KaspiProductImportResponse.UnmappedCharacteristic> unmapped,
            List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved
    ) {
        String label = clean(characteristic.label());
        String value = clean(characteristic.value());
        if (label == null || value == null) return;
        FieldKind kind = LABELS.get(normalize(label));
        if (kind == null) {
            unmapped.add(new KaspiProductImportResponse.UnmappedCharacteristic(label, value, "UNKNOWN_LABEL"));
            return;
        }
        Target target = targetFor(profile, kind);
        if (target == null) {
            unmapped.add(new KaspiProductImportResponse.UnmappedCharacteristic(
                    label, value, "UNSUPPORTED_FOR_CATEGORY"
            ));
            return;
        }

        Candidate candidate = resolveTarget(target, label, value, references, unresolved);
        if (candidate == null) return;
        if (conflictedTargets.contains(target.path())) {
            unresolved.add(candidate.asUnresolved("DUPLICATE_CONFLICT"));
            return;
        }
        Candidate previous = candidates.get(target.path());
        if (previous == null) {
            candidates.put(target.path(), candidate);
            return;
        }
        if (Objects.equals(previous.value(), candidate.value())) return;

        candidates.remove(target.path());
        conflictedTargets.add(target.path());
        unresolved.add(previous.asUnresolved("DUPLICATE_CONFLICT"));
        unresolved.add(candidate.asUnresolved("DUPLICATE_CONFLICT"));
    }

    private Candidate resolveTarget(
            Target target,
            String label,
            String value,
            CrmReferencesResponse references,
            List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved
    ) {
        if (target.dictionary() != null) {
            Resolution resolution = switch (target.dictionary()) {
                case MATERIAL -> resolveOptions(value, references.materials(), MATERIAL_ALIASES);
                case MECHANISM -> resolveOptions(value, references.mechanisms(), MECHANISM_ALIASES);
                case GENDER -> resolveOptions(value, references.genders(), GENDER_ALIASES);
                case GLASS -> resolveOptions(value, references.glassTypes(), GLASS_ALIASES);
                case STONE -> resolveOptions(value, references.stoneInlays(), Map.of());
                case COUNTRY -> resolveOptions(value, references.countries(), Map.of());
                case COLOR -> resolveOptions(value, references.interiorColors(), COLOR_ALIASES);
                case STYLE -> resolveOptions(value, references.interiorStyles(), STYLE_ALIASES);
                case INTERIOR_MECHANISM -> resolveOptions(value, references.interiorMechanisms(), MECHANISM_ALIASES);
                case POWER -> resolveOptions(value, references.interiorPowerTypes(), POWER_ALIASES);
            };
            if (resolution.option() == null) {
                unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                        label, value, target.path(), resolution.reason()
                ));
                return null;
            }
            return new Candidate(
                    label, value, target.path(), resolution.option().id(), resolution.option().name(), resolution.kind()
            );
        }

        Object parsedValue;
        String rendered;
        switch (target.valueType()) {
            case STRING -> {
                if (target.maxLength() != null && value.length() > target.maxLength()) {
                    unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                            label, value, target.path(), "INVALID_VALUE"
                    ));
                    return null;
                }
                parsedValue = value;
                rendered = value;
            }
            case INTEGER -> {
                Integer number = parseInteger(value, target.kind());
                if (number == null || number < 0) {
                    unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                            label, value, target.path(), "INVALID_VALUE"
                    ));
                    return null;
                }
                parsedValue = number;
                rendered = String.valueOf(number);
            }
            case BOOLEAN -> {
                Boolean bool = parseBoolean(value);
                if (bool == null) {
                    unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                            label, value, target.path(), "INVALID_VALUE"
                    ));
                    return null;
                }
                parsedValue = bool;
                rendered = String.valueOf(bool);
            }
            default -> throw new IllegalStateException("Unsupported value type");
        }
        return new Candidate(label, value, target.path(), parsedValue, rendered, "NORMALIZED");
    }

    private void reconcileInteriorCountry(
            CatalogCategoryProfile profile,
            Option brandOption,
            List<CrmBrandReferenceOptionResponse> brands,
            Map<String, Candidate> candidates,
            List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved
    ) {
        if (profile != CatalogCategoryProfile.INTERIOR_CLOCK) return;
        String path = "interiorClockDetails.productionCountryId";
        Candidate country = candidates.get(path);
        if (country == null) return;

        Long brandCountryId = brandOption == null ? null : brands.stream()
                .filter(brand -> Objects.equals(brand.id(), brandOption.id()))
                .map(CrmBrandReferenceOptionResponse::countryId)
                .findFirst()
                .orElse(null);
        if (brandCountryId == null || !Objects.equals(brandCountryId, country.value())) {
            candidates.remove(path);
            unresolved.add(country.asUnresolved("BRAND_COUNTRY_MISMATCH"));
        }
    }

    private Resolution resolveBrands(String value, List<CrmBrandReferenceOptionResponse> brands) {
        List<Option> options = brands.stream()
                .map(brand -> new Option(brand.id(), brand.name(), brand.code()))
                .toList();
        return resolve(value, options, Map.of());
    }

    private Resolution resolveOptions(
            String value,
            List<CrmReferenceOptionResponse> references,
            Map<String, String> aliases
    ) {
        return resolve(value, references.stream()
                .map(option -> new Option(option.id(), option.name(), option.code()))
                .toList(), aliases);
    }

    private Resolution resolve(String raw, List<Option> options, Map<String, String> aliases) {
        String trimmed = raw.trim();
        List<Option> exact = options.stream()
                .filter(option -> trimmed.equals(option.name()) || trimmed.equals(option.code()))
                .toList();
        if (exact.size() == 1) return new Resolution(exact.get(0), "EXACT", null);
        if (exact.size() > 1) return new Resolution(null, null, "AMBIGUOUS_VALUE");

        String normalized = normalize(trimmed);
        List<Option> normalizedMatches = options.stream()
                .filter(option -> normalized.equals(normalize(option.name())) || normalized.equals(normalize(option.code())))
                .toList();
        if (normalizedMatches.size() == 1) return new Resolution(normalizedMatches.get(0), "NORMALIZED", null);
        if (normalizedMatches.size() > 1) return new Resolution(null, null, "AMBIGUOUS_VALUE");

        String aliasCode = aliases.get(normalized);
        if (aliasCode != null) {
            List<Option> aliasMatches = options.stream()
                    .filter(option -> aliasCode.equalsIgnoreCase(option.code()))
                    .toList();
            if (aliasMatches.size() == 1) return new Resolution(aliasMatches.get(0), "ALIAS", null);
            if (aliasMatches.size() > 1) return new Resolution(null, null, "AMBIGUOUS_VALUE");
        }
        return new Resolution(null, null, "UNRESOLVED_VALUE");
    }

    private Target targetFor(CatalogCategoryProfile profile, FieldKind kind) {
        return switch (profile) {
            case WRISTWATCH -> switch (kind) {
                case CASE_MATERIAL -> dict("watchDetails.caseMaterialId", Dictionary.MATERIAL, kind);
                case STRAP_MATERIAL -> dict("watchDetails.strapMaterialId", Dictionary.MATERIAL, kind);
                case GLASS -> dict("watchDetails.glassTypeId", Dictionary.GLASS, kind);
                case MECHANISM -> dict("watchDetails.mechanismId", Dictionary.MECHANISM, kind);
                case GENDER -> dict("watchDetails.genderId", Dictionary.GENDER, kind);
                case CASE_SIZE -> integer("watchDetails.caseSizeMm", kind);
                case WATER_RESISTANCE -> string("watchDetails.waterResistance", kind, 50);
                case STONE -> dict("watchDetails.stoneInlayId", Dictionary.STONE, kind);
                default -> null;
            };
            case INTERIOR_CLOCK -> switch (kind) {
                case CASE_MATERIAL -> dict("interiorClockDetails.caseMaterialId", Dictionary.MATERIAL, kind);
                case COLOR, CASE_COLOR -> dict("interiorClockDetails.colorId", Dictionary.COLOR, kind);
                case STYLE -> dict("interiorClockDetails.styleId", Dictionary.STYLE, kind);
                case MECHANISM -> dict("interiorClockDetails.mechanismTypeId", Dictionary.INTERIOR_MECHANISM, kind);
                case POWER -> dict("interiorClockDetails.powerTypeId", Dictionary.POWER, kind);
                case COUNTRY -> dict("interiorClockDetails.productionCountryId", Dictionary.COUNTRY, kind);
                case DIMENSIONS, CASE_SIZE -> string("interiorClockDetails.dimensions", kind, 100);
                case WEIGHT -> integer("interiorClockDetails.weightGrams", kind);
                case WARRANTY -> integer("interiorClockDetails.warrantyMonths", kind);
                default -> null;
            };
            case ACCESSORY -> switch (kind) {
                case CASE_MATERIAL -> dict("accessoryDetails.caseMaterialId", Dictionary.MATERIAL, kind);
                case INSERT_MATERIAL -> dict("accessoryDetails.insertMaterialId", Dictionary.MATERIAL, kind);
                case COLOR, CASE_COLOR -> dict("accessoryDetails.colorId", Dictionary.COLOR, kind);
                case CLASP -> string("accessoryDetails.claspType", kind, 100);
                case HAS_INSERT -> bool("accessoryDetails.hasInsert", kind);
                case LENGTH, DIMENSIONS -> string("accessoryDetails.length", kind, 100);
                default -> null;
            };
            case GENERIC -> null;
        };
    }

    private static Integer parseInteger(String raw, FieldKind kind) {
        Matcher matcher = NUMBER.matcher(raw.replace('\u00a0', ' '));
        if (!matcher.find()) return null;
        String numericToken = matcher.group(1);
        if (matcher.find()) return null;
        try {
            double number = Double.parseDouble(numericToken.replace(',', '.'));
            String normalized = normalize(raw);
            if (kind == FieldKind.WEIGHT && normalized.matches(".*\\b(kg|кг|килограмм).*")) number *= 1000;
            if (kind == FieldKind.WARRANTY && normalized.matches(".*\\b(год|года|лет|year|years).*")) number *= 12;
            if (!Double.isFinite(number) || number > Integer.MAX_VALUE) return null;
            double integer = Math.rint(number);
            if (Math.abs(number - integer) > 0.000_001d) return null;
            return (int) integer;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Boolean parseBoolean(String raw) {
        return switch (normalize(raw)) {
            case "да", "есть", "имеется", "yes", "true" -> true;
            case "нет", "отсутствует", "no", "false" -> false;
            default -> null;
        };
    }

    public static String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replace('ё', 'е')
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private static Map<String, FieldKind> labelAliases() {
        Map<String, FieldKind> result = new HashMap<>();
        addLabels(result, FieldKind.CASE_MATERIAL, "Материал корпуса", "Корпус материал", "Case material");
        addLabels(result, FieldKind.STRAP_MATERIAL, "Материал браслета", "Материал ремешка", "Браслет", "Ремешок", "Strap material", "Bracelet material");
        addLabels(result, FieldKind.GLASS, "Стекло", "Тип стекла", "Glass", "Glass type");
        addLabels(result, FieldKind.MECHANISM, "Механизм", "Тип механизма", "Тип", "Movement", "Movement type");
        addLabels(result, FieldKind.WATER_RESISTANCE, "Водонепроницаемость", "Класс водонепроницаемости", "Водозащита", "Water resistance");
        addLabels(result, FieldKind.CASE_SIZE, "Диаметр корпуса", "Размер корпуса", "Диаметр", "Case size", "Case diameter");
        addLabels(result, FieldKind.CASE_THICKNESS, "Толщина корпуса", "Case thickness");
        addLabels(result, FieldKind.COLOR, "Цвет", "Color");
        addLabels(result, FieldKind.CASE_COLOR, "Цвет корпуса", "Case color");
        addLabels(result, FieldKind.GENDER, "Пол", "Для кого", "Gender");
        addLabels(result, FieldKind.STONE, "Вставка", "Камень", "Инкрустация", "Stone");
        addLabels(result, FieldKind.COUNTRY, "Страна производства", "Страна производитель", "Производитель страна", "Country of origin");
        addLabels(result, FieldKind.STYLE, "Стиль", "Style");
        addLabels(result, FieldKind.POWER, "Питание", "Источник питания", "Power source");
        addLabels(result, FieldKind.DIMENSIONS, "Размеры", "Габариты", "Dimensions");
        addLabels(result, FieldKind.WEIGHT, "Вес", "Weight");
        addLabels(result, FieldKind.WARRANTY, "Гарантия", "Warranty");
        addLabels(result, FieldKind.CLASP, "Тип застежки", "Застежка", "Clasp type");
        addLabels(result, FieldKind.INSERT_MATERIAL, "Материал вставки", "Материал инкрустации", "Insert material");
        addLabels(result, FieldKind.HAS_INSERT, "Наличие вставки", "Есть вставка", "Has insert");
        addLabels(result, FieldKind.LENGTH, "Длина", "Length");
        return Map.copyOf(result);
    }

    private static void addLabels(Map<String, FieldKind> target, FieldKind kind, String... labels) {
        for (String label : labels) target.put(normalize(label), kind);
    }

    private static Map<String, String> aliases(String... pairs) {
        Map<String, String> result = new HashMap<>();
        String code = null;
        for (int index = 0; index < pairs.length; index++) {
            String value = pairs[index];
            if (value.equals(value.toUpperCase(Locale.ROOT)) && value.matches("[A-Z_]+")) {
                code = value;
            } else if (code != null) {
                result.put(normalize(value), code);
            }
        }
        return Map.copyOf(result);
    }

    private static Target dict(String path, Dictionary dictionary, FieldKind kind) {
        return new Target(path, dictionary, null, kind, null);
    }

    private static Target string(String path, FieldKind kind, int maxLength) {
        return new Target(path, null, ValueType.STRING, kind, maxLength);
    }

    private static Target integer(String path, FieldKind kind) {
        return new Target(path, null, ValueType.INTEGER, kind, null);
    }

    private static Target bool(String path, FieldKind kind) {
        return new Target(path, null, ValueType.BOOLEAN, kind, null);
    }

    private static Long longValue(Map<String, Candidate> values, String path) {
        Candidate candidate = values.get(path);
        return candidate == null ? null : (Long) candidate.value();
    }

    private static Integer integerValue(Map<String, Candidate> values, String path) {
        Candidate candidate = values.get(path);
        return candidate == null ? null : (Integer) candidate.value();
    }

    private static String stringValue(Map<String, Candidate> values, String path) {
        Candidate candidate = values.get(path);
        return candidate == null ? null : (String) candidate.value();
    }

    private static Boolean booleanValue(Map<String, Candidate> values, String path) {
        Candidate candidate = values.get(path);
        return candidate == null ? null : (Boolean) candidate.value();
    }

    private static String clean(String value) {
        if (value == null) return null;
        String cleaned = value.replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private enum FieldKind {
        CASE_MATERIAL, STRAP_MATERIAL, GLASS, MECHANISM, WATER_RESISTANCE, CASE_SIZE,
        CASE_THICKNESS, COLOR, CASE_COLOR, GENDER, STONE, COUNTRY, STYLE, POWER,
        DIMENSIONS, WEIGHT, WARRANTY, CLASP, INSERT_MATERIAL, HAS_INSERT, LENGTH
    }

    private enum Dictionary {
        MATERIAL, MECHANISM, GENDER, GLASS, STONE, COUNTRY, COLOR, STYLE, INTERIOR_MECHANISM, POWER
    }

    private enum ValueType { STRING, INTEGER, BOOLEAN }

    private record Target(String path, Dictionary dictionary, ValueType valueType, FieldKind kind, Integer maxLength) {
    }

    private record Option(Long id, String name, String code) {
    }

    private record Resolution(Option option, String kind, String reason) {
    }

    private record Candidate(
            String sourceLabel,
            String sourceValue,
            String targetField,
            Object value,
            String resolvedValue,
            String resolution
    ) {
        private KaspiProductImportResponse.MappedCharacteristic asResponse() {
            return new KaspiProductImportResponse.MappedCharacteristic(
                    sourceLabel, sourceValue, targetField, resolvedValue, resolution
            );
        }

        private KaspiProductImportResponse.UnresolvedCharacteristic asUnresolved(String reason) {
            return new KaspiProductImportResponse.UnresolvedCharacteristic(
                    sourceLabel, sourceValue, targetField, reason
            );
        }
    }
}
