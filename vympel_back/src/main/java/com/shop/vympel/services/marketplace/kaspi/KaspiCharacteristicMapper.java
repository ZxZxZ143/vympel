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
import java.util.function.UnaryOperator;
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
            "BLUE", "синий", "синяя", "синее", "blue",
            "BROWN", "коричневый", "коричневая", "коричневое", "brown",
            "GREEN", "зеленый", "зеленая", "зеленое", "green",
            "RED", "красный", "красная", "красное", "red",
            "ROSE_GOLD", "розовое золото", "rose gold",
            "WOOD", "дерево", "деревянный", "wood"
    );
    private static final Map<String, String> DIAL_TYPE_ALIASES = aliases(
            "ANALOG", "аналоговый", "аналоговый стрелки", "стрелочный", "analog", "analog hands",
            "DIGITAL", "цифровой", "электронный", "digital",
            "ANALOG_DIGITAL", "комбинированный", "аналогово цифровой", "analog digital", "combined"
    );
    private static final Map<String, String> DIAL_MARKING_ALIASES = aliases(
            "MARKERS", "штрихи", "метки", "индексы", "markers", "indexes",
            "ARABIC", "арабские цифры", "арабские", "arabic numerals",
            "ROMAN", "римские цифры", "римские", "roman numerals",
            "NO_MARKS", "без цифр", "без меток", "нет", "no markings",
            "MIXED", "смешанные", "смешанная", "комбинированные", "mixed"
    );
    private static final Map<String, String> WATCH_POWER_ALIASES = aliases(
            "BATTERY", "от батарейки", "батарейка", "батарея", "battery",
            "MECHANICAL", "механический", "механический завод", "mechanical",
            "SOLAR", "солнечная энергия", "солнечная батарея", "solar", "solar energy",
            "KINETIC", "кинетический аккумулятор", "кинетическая", "kinetic"
    );
    private static final Map<String, String> WATER_RESISTANCE_ALIASES = aliases(
            "WR30", "wr30", "wr 30", "3 атм", "30 м", "30m",
            "WR50", "wr50", "wr 50", "5 атм", "50 м", "50m",
            "WR100", "wr100", "wr 100", "10 атм", "100 м", "100m",
            "WR200", "wr200", "wr 200", "20 атм", "200 м", "200m"
    );
    private static final Map<String, String> WATCH_FEATURE_ALIASES = aliases(
            "DATE", "дата", "отображение даты", "календарь", "date", "date display",
            "DAY_OF_WEEK", "день недели", "day of week",
            "CHRONOGRAPH", "хронограф", "chronograph",
            "STOPWATCH", "секундомер", "stopwatch",
            "ALARM", "будильник", "alarm",
            "BACKLIGHT", "подсветка", "backlight",
            "GMT", "второй часовой пояс", "gmt", "second time zone",
            "MOON_PHASE", "лунный календарь", "фаза луны", "moon phase",
            "TACHYMETER", "тахиметр", "tachymeter",
            "LUME", "светонакопительные стрелки", "светонакопительные метки",
            "светонакопительные стрелки метки", "люминесцентные метки", "luminous markers"
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
        return mapInternal(
                parsed, sourceUrl, categoryId, profile, references, UnaryOperator.identity(), false
        );
    }

    public KaspiProductImportResponse mapWithCharacteristicNormalization(
            KaspiParsedProduct parsed,
            String sourceUrl,
            Long categoryId,
            CatalogCategoryProfile profile,
            CrmReferencesResponse references,
            UnaryOperator<KaspiCharacteristic> characteristicNormalizer
    ) {
        return mapInternal(
                parsed, sourceUrl, categoryId, profile, references,
                Objects.requireNonNull(characteristicNormalizer), true
        );
    }

    private KaspiProductImportResponse mapInternal(
            KaspiParsedProduct parsed,
            String sourceUrl,
            Long categoryId,
            CatalogCategoryProfile profile,
            CrmReferencesResponse references,
            UnaryOperator<KaspiCharacteristic> characteristicNormalizer,
            boolean reportEveryMappedCharacteristic
    ) {
        List<KaspiProductImportResponse.MappedField> mappedFields = new ArrayList<>();
        List<KaspiProductImportResponse.UnmappedCharacteristic> unmapped = new ArrayList<>();
        List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved = new ArrayList<>();
        Set<String> warnings = new LinkedHashSet<>(parsed.warnings());
        Map<String, Candidate> candidates = new LinkedHashMap<>();
        Map<String, List<Candidate>> mappedSources = new LinkedHashMap<>();
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
            KaspiCharacteristic normalized = Objects.requireNonNull(
                    characteristicNormalizer.apply(characteristic),
                    "Characteristic normalizer must not discard source characteristics"
            );
            mapCharacteristic(
                    characteristic, normalized, profile, references, candidates, mappedSources,
                    conflictedTargets, unmapped, unresolved, reportEveryMappedCharacteristic
            );
        }
        reconcileInteriorCountry(
                profile, brandOption, references.brands(), candidates, mappedSources,
                unresolved, reportEveryMappedCharacteristic
        );

        List<KaspiProductImportResponse.MappedCharacteristic> mappedCharacteristics =
                (reportEveryMappedCharacteristic
                        ? mappedSources.values().stream().flatMap(List::stream)
                        : candidates.values().stream())
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
                longValue(candidates, "watchDetails.stoneInlayId"),
                longValue(candidates, "watchDetails.dialTypeId"),
                longValue(candidates, "watchDetails.dialMarkingId"),
                longValue(candidates, "watchDetails.powerSourceId"),
                longValue(candidates, "watchDetails.waterResistanceId"),
                longValue(candidates, "watchDetails.strapColorId"),
                longValue(candidates, "watchDetails.dialColorId"),
                stringValue(candidates, "watchDetails.packageContents"),
                longListValue(candidates, "watchDetails.featureIds")
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
            KaspiCharacteristic sourceCharacteristic,
            KaspiCharacteristic normalizedCharacteristic,
            CatalogCategoryProfile profile,
            CrmReferencesResponse references,
            Map<String, Candidate> candidates,
            Map<String, List<Candidate>> mappedSources,
            Set<String> conflictedTargets,
            List<KaspiProductImportResponse.UnmappedCharacteristic> unmapped,
            List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved,
            boolean reportEveryMappedCharacteristic
    ) {
        String sourceLabel = clean(sourceCharacteristic.label());
        String sourceValue = clean(sourceCharacteristic.value());
        if (sourceLabel == null || sourceValue == null) {
            if (reportEveryMappedCharacteristic) {
                unmapped.add(new KaspiProductImportResponse.UnmappedCharacteristic(
                        Objects.toString(sourceCharacteristic.label(), ""),
                        Objects.toString(sourceCharacteristic.value(), ""),
                        "INVALID_VALUE"
                ));
            }
            return;
        }
        String normalizedLabel = clean(normalizedCharacteristic.label());
        String normalizedValue = clean(normalizedCharacteristic.value());
        if (normalizedLabel == null || normalizedValue == null) {
            unmapped.add(new KaspiProductImportResponse.UnmappedCharacteristic(
                    sourceLabel, sourceValue, "UNKNOWN_LABEL"
            ));
            return;
        }
        FieldKind kind = LABELS.get(normalize(normalizedLabel));
        if (kind == null) {
            unmapped.add(new KaspiProductImportResponse.UnmappedCharacteristic(
                    sourceLabel, sourceValue, "UNKNOWN_LABEL"
            ));
            return;
        }
        Target target = targetFor(profile, kind);
        if (target == null) {
            unmapped.add(new KaspiProductImportResponse.UnmappedCharacteristic(
                    sourceLabel, sourceValue, "UNSUPPORTED_FOR_CATEGORY"
            ));
            return;
        }

        Candidate candidate = resolveTarget(
                target, sourceLabel, sourceValue, normalizedLabel, normalizedValue, references, unresolved
        );
        if (candidate == null) return;
        if (conflictedTargets.contains(target.path())) {
            unresolved.add(candidate.asUnresolved("DUPLICATE_CONFLICT"));
            return;
        }
        Candidate previous = candidates.get(target.path());
        if (previous == null) {
            candidates.put(target.path(), candidate);
            addMappedSource(mappedSources, candidate, reportEveryMappedCharacteristic);
            return;
        }
        if (Objects.equals(previous.value(), candidate.value())) {
            addMappedSource(mappedSources, candidate, reportEveryMappedCharacteristic);
            return;
        }
        if ("watchDetails.featureIds".equals(target.path())) {
            candidates.put(target.path(), mergeFeatureCandidates(previous, candidate));
            addMappedSource(mappedSources, candidate, reportEveryMappedCharacteristic);
            return;
        }

        candidates.remove(target.path());
        conflictedTargets.add(target.path());
        if (reportEveryMappedCharacteristic) {
            List<Candidate> previousSources = mappedSources.remove(target.path());
            if (previousSources == null || previousSources.isEmpty()) {
                unresolved.add(previous.asUnresolved("DUPLICATE_CONFLICT"));
            } else {
                previousSources.stream()
                        .map(source -> source.asUnresolved("DUPLICATE_CONFLICT"))
                        .forEach(unresolved::add);
            }
        } else {
            unresolved.add(previous.asUnresolved("DUPLICATE_CONFLICT"));
        }
        unresolved.add(candidate.asUnresolved("DUPLICATE_CONFLICT"));
    }

    private void addMappedSource(
            Map<String, List<Candidate>> mappedSources,
            Candidate candidate,
            boolean reportEveryMappedCharacteristic
    ) {
        if (reportEveryMappedCharacteristic) {
            mappedSources.computeIfAbsent(candidate.targetField(), ignored -> new ArrayList<>()).add(candidate);
        }
    }

    private Candidate resolveTarget(
            Target target,
            String sourceLabel,
            String sourceValue,
            String normalizedLabel,
            String normalizedValue,
            CrmReferencesResponse references,
            List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved
    ) {
        if (target.dictionary() == Dictionary.WATCH_FEATURE) {
            FeatureListResolution resolution = resolveWatchFeatureList(
                    normalizedLabel, normalizedValue, references.watchFeatures()
            );
            if (resolution.options().isEmpty()) {
                unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                        sourceLabel, sourceValue, target.path(), resolution.reason()
                ));
                return null;
            }
            return new Candidate(
                    sourceLabel,
                    sourceValue,
                    target.path(),
                    resolution.options().stream().map(Option::id).toList(),
                    resolution.options().stream().map(Option::name).reduce((left, right) -> left + ", " + right).orElse(""),
                    resolution.kind()
            );
        }
        if (target.dictionary() != null) {
            Resolution resolution = switch (target.dictionary()) {
                case MATERIAL -> resolveOptions(normalizedValue, references.materials(), MATERIAL_ALIASES);
                case MECHANISM -> resolveOptions(normalizedValue, references.mechanisms(), MECHANISM_ALIASES);
                case GENDER -> resolveOptions(normalizedValue, references.genders(), GENDER_ALIASES);
                case GLASS -> resolveOptions(normalizedValue, references.glassTypes(), GLASS_ALIASES);
                case STONE -> resolveOptions(normalizedValue, references.stoneInlays(), Map.of());
                case COUNTRY -> resolveOptions(normalizedValue, references.countries(), Map.of());
                case COLOR -> resolveOptions(normalizedValue, references.interiorColors(), COLOR_ALIASES);
                case STYLE -> resolveOptions(normalizedValue, references.interiorStyles(), STYLE_ALIASES);
                case INTERIOR_MECHANISM -> resolveOptions(normalizedValue, references.interiorMechanisms(), MECHANISM_ALIASES);
                case POWER -> resolveOptions(normalizedValue, references.interiorPowerTypes(), POWER_ALIASES);
                case DIAL_TYPE -> resolveOptions(normalizedValue, references.watchDialTypes(), DIAL_TYPE_ALIASES);
                case DIAL_MARKING -> resolveOptions(normalizedValue, references.watchDialMarkings(), DIAL_MARKING_ALIASES);
                case WATCH_POWER -> resolveOptions(normalizedValue, references.watchPowerSources(), WATCH_POWER_ALIASES);
                case WATER_RESISTANCE -> resolveOptions(normalizedValue, references.watchWaterResistances(), WATER_RESISTANCE_ALIASES);
                case WATCH_FEATURE -> throw new IllegalStateException("Watch features use multi-value resolution");
            };
            if (resolution.option() == null) {
                unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                        sourceLabel, sourceValue, target.path(), resolution.reason()
                ));
                return null;
            }
            return new Candidate(
                    sourceLabel, sourceValue, target.path(), resolution.option().id(),
                    resolution.option().name(), resolution.kind()
            );
        }

        Object parsedValue;
        String rendered;
        switch (target.valueType()) {
            case STRING -> {
                if (target.maxLength() != null && normalizedValue.length() > target.maxLength()) {
                    unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                            sourceLabel, sourceValue, target.path(), "INVALID_VALUE"
                    ));
                    return null;
                }
                parsedValue = normalizedValue;
                rendered = normalizedValue;
            }
            case INTEGER -> {
                Integer number = parseInteger(normalizedValue, target.kind());
                if (number == null || number < 0) {
                    unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                            sourceLabel, sourceValue, target.path(), "INVALID_VALUE"
                    ));
                    return null;
                }
                parsedValue = number;
                rendered = String.valueOf(number);
            }
            case BOOLEAN -> {
                Boolean bool = parseBoolean(normalizedValue);
                if (bool == null) {
                    unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                            sourceLabel, sourceValue, target.path(), "INVALID_VALUE"
                    ));
                    return null;
                }
                parsedValue = bool;
                rendered = String.valueOf(bool);
            }
            default -> throw new IllegalStateException("Unsupported value type");
        }
        return new Candidate(sourceLabel, sourceValue, target.path(), parsedValue, rendered, "NORMALIZED");
    }

    private void reconcileInteriorCountry(
            CatalogCategoryProfile profile,
            Option brandOption,
            List<CrmBrandReferenceOptionResponse> brands,
            Map<String, Candidate> candidates,
            Map<String, List<Candidate>> mappedSources,
            List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved,
            boolean reportEveryMappedCharacteristic
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
            if (reportEveryMappedCharacteristic) {
                List<Candidate> sources = mappedSources.remove(path);
                if (sources != null && !sources.isEmpty()) {
                    sources.stream()
                            .map(source -> source.asUnresolved("BRAND_COUNTRY_MISMATCH"))
                            .forEach(unresolved::add);
                    return;
                }
            }
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

    private FeatureListResolution resolveWatchFeatureList(
            String label,
            String raw,
            List<CrmReferenceOptionResponse> references
    ) {
        List<Option> options = references.stream()
                .map(option -> new Option(option.id(), option.name(), option.code()))
                .toList();
        Resolution wholeValue = resolve(raw, options, WATCH_FEATURE_ALIASES);
        if (wholeValue.option() != null) {
            return new FeatureListResolution(List.of(wholeValue.option()), wholeValue.kind(), null);
        }

        Resolution featureLabel = resolve(label, options, WATCH_FEATURE_ALIASES);
        if (featureLabel.option() != null && indicatesFeaturePresence(raw)) {
            return new FeatureListResolution(List.of(featureLabel.option()), featureLabel.kind(), null);
        }

        String[] tokens = raw.split("[,;\\n]+");
        if (tokens.length < 2) {
            return new FeatureListResolution(List.of(), null, wholeValue.reason());
        }
        Map<Long, Option> resolved = new LinkedHashMap<>();
        String kind = "EXACT";
        for (String token : tokens) {
            Resolution part = resolve(token, options, WATCH_FEATURE_ALIASES);
            if (part.option() == null) {
                return new FeatureListResolution(List.of(), null, part.reason());
            }
            resolved.putIfAbsent(part.option().id(), part.option());
            if ("ALIAS".equals(part.kind())) kind = "ALIAS";
            else if ("NORMALIZED".equals(part.kind()) && !"ALIAS".equals(kind)) kind = "NORMALIZED";
        }
        return new FeatureListResolution(List.copyOf(resolved.values()), kind, null);
    }

    private boolean indicatesFeaturePresence(String raw) {
        return Set.of(
                "да", "есть", "имеется", "предусмотрено", "число", "дата", "день", "день месяца",
                "yes", "true", "available", "number", "date", "day", "day of month", "calendar"
        ).contains(normalize(raw));
    }

    @SuppressWarnings("unchecked")
    private Candidate mergeFeatureCandidates(Candidate previous, Candidate next) {
        LinkedHashSet<Long> ids = new LinkedHashSet<>((List<Long>) previous.value());
        ids.addAll((List<Long>) next.value());
        LinkedHashSet<String> names = new LinkedHashSet<>();
        for (String name : (previous.resolvedValue() + ", " + next.resolvedValue()).split(",\\s*")) {
            if (!name.isBlank()) names.add(name);
        }
        return new Candidate(
                previous.sourceLabel(),
                previous.sourceValue() + "; " + next.sourceLabel() + ": " + next.sourceValue(),
                previous.targetField(),
                List.copyOf(ids),
                String.join(", ", names),
                "NORMALIZED"
        );
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
                case WATER_RESISTANCE -> dict("watchDetails.waterResistanceId", Dictionary.WATER_RESISTANCE, kind);
                case STONE -> dict("watchDetails.stoneInlayId", Dictionary.STONE, kind);
                case DIAL_TYPE -> dict("watchDetails.dialTypeId", Dictionary.DIAL_TYPE, kind);
                case DIAL_MARKING -> dict("watchDetails.dialMarkingId", Dictionary.DIAL_MARKING, kind);
                case POWER -> dict("watchDetails.powerSourceId", Dictionary.WATCH_POWER, kind);
                case STRAP_COLOR -> dict("watchDetails.strapColorId", Dictionary.COLOR, kind);
                case DIAL_COLOR -> dict("watchDetails.dialColorId", Dictionary.COLOR, kind);
                case PACKAGE_CONTENTS -> string("watchDetails.packageContents", kind, 500);
                case WATCH_FEATURES -> dict("watchDetails.featureIds", Dictionary.WATCH_FEATURE, kind);
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
        String normalized = normalize(raw);
        if (kind == FieldKind.CASE_SIZE
                && normalized.matches(".*\\b(cm|см|сантиметр|сантиметра|сантиметров)\\b.*")) {
            return null;
        }
        Matcher matcher = NUMBER.matcher(raw.replace('\u00a0', ' '));
        if (!matcher.find()) return null;
        String numericToken = matcher.group(1);
        if (matcher.find()) return null;
        try {
            double number = Double.parseDouble(numericToken.replace(',', '.'));
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
        addLabels(result, FieldKind.GLASS, "Стекло", "Тип стекла", "Вид стекла", "Glass", "Glass type");
        addLabels(result, FieldKind.MECHANISM, "Механизм", "Механизм часов", "Тип механизма", "Тип", "Movement", "Movement type");
        addLabels(result, FieldKind.WATER_RESISTANCE, "Водонепроницаемость", "Класс водонепроницаемости", "Водозащита", "Water resistance");
        addLabels(result, FieldKind.CASE_SIZE, "Диаметр корпуса", "Размер корпуса", "Диаметр", "Case size", "Case diameter");
        addLabels(result, FieldKind.CASE_THICKNESS, "Толщина корпуса", "Case thickness");
        addLabels(result, FieldKind.COLOR, "Цвет", "Color");
        addLabels(result, FieldKind.CASE_COLOR, "Цвет корпуса", "Case color");
        addLabels(result, FieldKind.STRAP_COLOR, "Цвет ремешка", "Цвет браслета", "Strap color", "Bracelet color");
        addLabels(result, FieldKind.DIAL_COLOR, "Цвет циферблата", "Цвет дисплея", "Dial color", "Display color");
        addLabels(result, FieldKind.DIAL_TYPE, "Способ отображения времени", "Тип отображения времени", "Тип циферблата", "Dial type", "Time display type");
        addLabels(result, FieldKind.DIAL_MARKING, "Цифры", "Разметка циферблата", "Метки циферблата", "Dial markings", "Dial markers");
        addLabels(result, FieldKind.PACKAGE_CONTENTS, "Комплектация", "Комплект поставки", "Package contents");
        addLabels(
                result,
                FieldKind.WATCH_FEATURES,
                "Особенности часов", "Функции часов", "Дополнительные функции", "Функции", "Функция",
                "Отображение даты", "Календарь", "Хронограф", "Секундомер", "Будильник", "Подсветка",
                "Watch features", "Watch functions", "Date display", "Calendar", "Chronograph", "Stopwatch", "Alarm", "Backlight"
        );
        addLabels(result, FieldKind.GENDER, "Пол", "Для кого", "Gender");
        addLabels(result, FieldKind.STONE, "Вставка", "Камень", "Инкрустация", "Stone");
        addLabels(result, FieldKind.COUNTRY, "Страна производства", "Страна производитель", "Производитель страна", "Country of origin");
        addLabels(result, FieldKind.STYLE, "Стиль", "Style");
        addLabels(result, FieldKind.POWER, "Питание", "Источник энергии", "Источник питания", "Power source", "Energy source");
        addLabels(result, FieldKind.DIMENSIONS, "Размеры", "Габариты", "Dimensions");
        addLabels(result, FieldKind.WEIGHT, "Вес", "Weight");
        addLabels(result, FieldKind.WARRANTY, "Гарантия", "Гарантийный срок", "Warranty");
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

    @SuppressWarnings("unchecked")
    private static List<Long> longListValue(Map<String, Candidate> values, String path) {
        Candidate candidate = values.get(path);
        return candidate == null ? List.of() : (List<Long>) candidate.value();
    }

    private static String clean(String value) {
        if (value == null) return null;
        String cleaned = value.replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private enum FieldKind {
        CASE_MATERIAL, STRAP_MATERIAL, GLASS, MECHANISM, WATER_RESISTANCE, CASE_SIZE,
        CASE_THICKNESS, COLOR, CASE_COLOR, STRAP_COLOR, DIAL_COLOR, DIAL_TYPE, DIAL_MARKING,
        GENDER, STONE, COUNTRY, STYLE, POWER, PACKAGE_CONTENTS, WATCH_FEATURES,
        DIMENSIONS, WEIGHT, WARRANTY, CLASP, INSERT_MATERIAL, HAS_INSERT, LENGTH
    }

    private enum Dictionary {
        MATERIAL, MECHANISM, GENDER, GLASS, STONE, COUNTRY, COLOR, STYLE, INTERIOR_MECHANISM, POWER,
        DIAL_TYPE, DIAL_MARKING, WATCH_POWER, WATER_RESISTANCE, WATCH_FEATURE
    }

    private enum ValueType { STRING, INTEGER, BOOLEAN }

    private record Target(String path, Dictionary dictionary, ValueType valueType, FieldKind kind, Integer maxLength) {
    }

    private record Option(Long id, String name, String code) {
    }

    private record Resolution(Option option, String kind, String reason) {
    }

    private record FeatureListResolution(List<Option> options, String kind, String reason) {
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
