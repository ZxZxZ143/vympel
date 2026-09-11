package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.marketplace.kaspi.KaspiCharacteristic;
import com.shop.vympel.services.marketplace.kaspi.KaspiCharacteristicMapper;
import com.shop.vympel.services.marketplace.kaspi.KaspiParsedProduct;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WildberriesCharacteristicMapper {
    private static final String INVALID_CASE_SIZE = "unsupported-wildberries-case-size";
    private static final Pattern CASE_SIZE_MM = Pattern.compile("(?iu)^\\s*(\\d{1,4})(?:[.,](\\d+))?\\s*(?:мм|mm)\\s*$");
    private static final Pattern WATER_WR = Pattern.compile("(?iu)(?<![\\p{L}\\p{N}])wr\\s*(30|50|100|200)(?!\\p{N})");
    private static final Pattern WATER_ATM = Pattern.compile("(?iu)(?<!\\d)(3|5|10|20)\\s*(?:атм|atm)(?!\\p{L})");
    private static final Pattern WATER_METRES = Pattern.compile("(?iu)(?<!\\d)(30|50|100|200)\\s*(?:м|m)(?![\\p{L}\\p{N}])");
    private static final Pattern PACKAGE_PREFIX = Pattern.compile("(?iu)^\\s*комплектация\\s*:\\s*");
    private static final Pattern FEATURE_PREFIX = Pattern.compile("(?iu)^\\s*(?:функции|особенности)\\s*:\\s*");
    private static final Pattern FEATURE_SEPARATOR = Pattern.compile("\\s*(?:[,;|•\\n]+|/)\\s*");
    private static final Map<String, String> LABEL_ALIASES = labelAliases();
    private static final Map<String, String> FEATURE_ALIASES = featureAliases();
    private static final Set<String> NEGATIVE_FEATURE_VALUES = Set.of(
            "нет", "не предусмотрено", "не предусмотрены", "отсутствует", "отсутствуют",
            "без функций", "no", "none", "not available"
    );

    private final KaspiCharacteristicMapper delegate;

    public WildberriesCharacteristicMapper(KaspiCharacteristicMapper delegate) {
        this.delegate = delegate;
    }

    public KaspiProductImportResponse map(
            KaspiParsedProduct parsed,
            String sourceUrl,
            Long categoryId,
            CatalogCategoryProfile profile,
            CrmReferencesResponse references
    ) {
        List<KaspiCharacteristic> modelCharacteristics = parsed.characteristics().stream()
                .filter(this::isModel)
                .toList();
        List<KaspiCharacteristic> technicalCharacteristics = parsed.characteristics().stream()
                .filter(characteristic -> !isModel(characteristic))
                .toList();
        KaspiParsedProduct technicalProduct = new KaspiParsedProduct(
                parsed.name(), parsed.brand(), parsed.model(), parsed.price(), null,
                technicalCharacteristics, parsed.warnings()
        );
        KaspiProductImportResponse mapped = delegate.mapWithCharacteristicNormalization(
                technicalProduct, sourceUrl, categoryId, profile, references, this::normalizeCharacteristic
        );

        List<KaspiProductImportResponse.MappedField> mappedFields = mapped.mappedFields().stream()
                .filter(field -> !"descriptionRu".equals(field.targetField()))
                .toList();
        List<KaspiProductImportResponse.MappedCharacteristic> mappedCharacteristics =
                new ArrayList<>(mapped.mappedCharacteristics());
        List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved =
                new ArrayList<>(mapped.unresolvedCharacteristics());
        mapModelCharacteristics(parsed.model(), modelCharacteristics, mappedCharacteristics, unresolved);

        LinkedHashSet<String> warnings = new LinkedHashSet<>(mapped.warnings());
        if (!unresolved.isEmpty()) warnings.add("UNRESOLVED_VALUES_PRESENT");
        KaspiProductImportResponse.Values values = mapped.values();
        return new KaspiProductImportResponse(
                mapped.source(), mapped.sourceUrl(), mapped.categoryId(), mapped.categoryProfile(),
                new KaspiProductImportResponse.Values(
                        values.nameRu(), values.brandId(), values.model(), values.price(), null,
                        values.kaspiUrl(), values.watchDetails(), values.interiorClockDetails(), values.accessoryDetails()
                ),
                mappedFields,
                List.copyOf(mappedCharacteristics),
                mapped.unmappedCharacteristics(),
                List.copyOf(unresolved),
                List.copyOf(warnings)
        );
    }

    private void mapModelCharacteristics(
            String model,
            List<KaspiCharacteristic> characteristics,
            List<KaspiProductImportResponse.MappedCharacteristic> mapped,
            List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolved
    ) {
        if (characteristics.isEmpty()) return;
        String normalizedModel = KaspiCharacteristicMapper.normalize(model);
        boolean matchesEverySource = !normalizedModel.isBlank() && characteristics.stream()
                .map(KaspiCharacteristic::value)
                .map(KaspiCharacteristicMapper::normalize)
                .allMatch(normalizedModel::equals);
        if (matchesEverySource) {
            for (KaspiCharacteristic characteristic : characteristics) {
                mapped.add(new KaspiProductImportResponse.MappedCharacteristic(
                        characteristic.label(), characteristic.value(), "model", model,
                        model.equals(characteristic.value()) ? "EXACT" : "NORMALIZED"
                ));
            }
            return;
        }

        String reason = characteristics.stream()
                .map(KaspiCharacteristic::value)
                .map(KaspiCharacteristicMapper::normalize)
                .distinct()
                .count() > 1 ? "DUPLICATE_CONFLICT" : "UNRESOLVED_VALUE";
        for (KaspiCharacteristic characteristic : characteristics) {
            unresolved.add(new KaspiProductImportResponse.UnresolvedCharacteristic(
                    characteristic.label(), characteristic.value(), "model", reason
            ));
        }
    }

    private boolean isModel(KaspiCharacteristic characteristic) {
        return "модель".equals(KaspiCharacteristicMapper.normalize(characteristic.label()));
    }

    private KaspiCharacteristic normalizeCharacteristic(KaspiCharacteristic source) {
        String normalizedLabel = KaspiCharacteristicMapper.normalize(source.label());
        String targetLabel = LABEL_ALIASES.getOrDefault(normalizedLabel, source.label());
        String value = source.value();
        if ("Диаметр корпуса".equals(targetLabel)) {
            value = normalizeCaseSize(value);
        } else if ("Водонепроницаемость".equals(targetLabel)) {
            value = normalizeWaterResistance(value);
        } else if ("Комплектация".equals(targetLabel)) {
            value = normalizePackageContents(value);
        } else if ("Функции".equals(targetLabel)) {
            value = normalizeFeatures(value);
        }
        return new KaspiCharacteristic(targetLabel, value);
    }

    private String normalizeCaseSize(String raw) {
        if (raw == null) return INVALID_CASE_SIZE;
        Matcher matcher = CASE_SIZE_MM.matcher(raw);
        if (!matcher.matches()) return INVALID_CASE_SIZE;
        String fraction = matcher.group(2);
        if (fraction != null && fraction.codePoints().anyMatch(digit -> digit != '0')) {
            return INVALID_CASE_SIZE;
        }
        try {
            int millimetres = Integer.parseInt(matcher.group(1));
            return millimetres >= 1 && millimetres <= 999
                    ? millimetres + " мм"
                    : INVALID_CASE_SIZE;
        } catch (NumberFormatException ex) {
            return INVALID_CASE_SIZE;
        }
    }

    private String normalizeWaterResistance(String raw) {
        if (raw == null) return "";
        LinkedHashSet<String> codes = new LinkedHashSet<>();
        addWaterMatches(codes, WATER_WR.matcher(raw), false);
        addWaterMatches(codes, WATER_ATM.matcher(raw), true);
        addWaterMatches(codes, WATER_METRES.matcher(raw), false);
        return codes.size() == 1 ? codes.iterator().next() : raw;
    }

    private void addWaterMatches(Set<String> codes, Matcher matcher, boolean atmospheres) {
        while (matcher.find()) {
            int level = Integer.parseInt(matcher.group(1));
            int metres = atmospheres ? level * 10 : level;
            codes.add("WR" + metres);
        }
    }

    private String normalizePackageContents(String raw) {
        if (raw == null) return "";
        String value = raw.trim();
        Matcher matcher = PACKAGE_PREFIX.matcher(value);
        while (matcher.find()) {
            value = value.substring(matcher.end()).trim();
            matcher = PACKAGE_PREFIX.matcher(value);
        }
        return value;
    }

    private String normalizeFeatures(String raw) {
        if (raw == null) return "";
        String value = FEATURE_PREFIX.matcher(raw).replaceFirst("").trim();
        if (NEGATIVE_FEATURE_VALUES.contains(KaspiCharacteristicMapper.normalize(value))) return value;

        LinkedHashSet<String> codes = new LinkedHashSet<>();
        String[] tokens = FEATURE_SEPARATOR.split(value);
        if (tokens.length == 0) return value;
        for (String token : tokens) {
            String normalized = KaspiCharacteristicMapper.normalize(token);
            if (NEGATIVE_FEATURE_VALUES.contains(normalized)) return value;
            String code = FEATURE_ALIASES.get(normalized);
            if (code == null) return value;
            codes.add(code);
        }
        return codes.isEmpty() ? value : String.join("; ", codes);
    }

    private static Map<String, String> labelAliases() {
        Map<String, String> result = new LinkedHashMap<>();
        addLabels(result, "Модель", "Модель");
        addLabels(result, "Для кого", "Для кого", "Пол");
        addLabels(result, "Материал корпуса", "Материал корпуса");
        addLabels(result, "Материал браслета", "Материал браслета", "Материал ремешка");
        addLabels(result, "Стекло", "Стекло", "Вид стекла", "Тип стекла");
        addLabels(result, "Диаметр корпуса", "Диаметр корпуса", "Диаметр циферблата", "Размер корпуса");
        addLabels(result, "Тип механизма", "Тип механизма", "Механизм часов");
        addLabels(result, "Способ отображения времени", "Способ отображения времени", "Тип отображения времени");
        addLabels(result, "Цифры", "Цифры", "Тип цифр", "Разметка циферблата");
        addLabels(result, "Источник питания", "Источник питания");
        addLabels(result, "Водонепроницаемость", "Водонепроницаемость", "Класс водонепроницаемости", "Водозащита");
        addLabels(result, "Цвет ремешка", "Цвет ремешка", "Цвет браслета");
        addLabels(result, "Цвет циферблата", "Цвет циферблата");
        addLabels(result, "Комплектация", "Комплектация");
        addLabels(result, "Функции", "Функции", "Особенности");
        return Map.copyOf(result);
    }

    private static Map<String, String> featureAliases() {
        Map<String, String> result = new LinkedHashMap<>();
        addFeatures(
                result, "MOON_PHASE",
                "Индикатор фазы луны", "Индикатор фаз луны", "Фаза луны", "Лунный календарь", "Moon phase"
        );
        addFeatures(result, "CHRONOGRAPH", "Хронограф", "Chronograph");
        addFeatures(result, "STOPWATCH", "Секундомер", "Stopwatch");
        addFeatures(result, "DATE", "Отображение даты", "Дата", "Календарь", "Date", "Date display");
        addFeatures(result, "ALARM", "Будильник", "Alarm");
        addFeatures(result, "BACKLIGHT", "Подсветка", "Backlight");
        addFeatures(
                result, "GMT",
                "Второй часовой пояс", "GMT", "Второй часовой пояс GMT", "Second time zone"
        );
        return Map.copyOf(result);
    }

    private static void addLabels(Map<String, String> target, String canonical, String... aliases) {
        for (String alias : aliases) target.put(KaspiCharacteristicMapper.normalize(alias), canonical);
    }

    private static void addFeatures(Map<String, String> target, String code, String... aliases) {
        for (String alias : aliases) target.put(KaspiCharacteristicMapper.normalize(alias), code);
    }
}
