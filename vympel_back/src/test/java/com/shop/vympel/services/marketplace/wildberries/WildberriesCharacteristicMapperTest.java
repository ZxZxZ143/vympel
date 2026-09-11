package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.marketplace.kaspi.KaspiCharacteristic;
import com.shop.vympel.services.marketplace.kaspi.KaspiCharacteristicMapper;
import com.shop.vympel.services.marketplace.kaspi.KaspiParsedProduct;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WildberriesCharacteristicMapperTest {
    private static final String SOURCE_URL =
            "https://global.wildberries.ru/catalog/322229674/detail.aspx";

    private final WildberriesProductParser parser = new WildberriesProductParser(new ObjectMapper());
    private final WildberriesCharacteristicMapper mapper =
            new WildberriesCharacteristicMapper(new KaspiCharacteristicMapper());

    @Test
    void mapsTheSanitizedArticleWithoutUsingItsDescriptionOrDroppingCharacteristics() throws Exception {
        KaspiParsedProduct parsed = parser.parse(
                fixture("card-v4-322229674.json"),
                fixture("card-detail-322229674.json"),
                322229674L
        ).product();

        KaspiProductImportResponse response = map(parsed);
        KaspiProductImportResponse.WatchDetails watch = response.values().watchDetails();

        assertNull(response.values().descriptionRu());
        assertFalse(response.mappedFields().stream()
                .anyMatch(field -> field.targetField().equals("descriptionRu")));
        assertEquals("2616", response.values().model());
        assertEquals(6L, watch.genderId());
        assertEquals(1L, watch.caseMaterialId());
        assertEquals(2L, watch.strapMaterialId());
        assertEquals(4L, watch.glassTypeId());
        assertEquals(41, watch.caseSizeMm());
        assertEquals(5L, watch.mechanismId());
        assertEquals(30L, watch.dialTypeId());
        assertEquals(31L, watch.dialMarkingId());
        assertEquals(33L, watch.waterResistanceId());
        assertEquals(List.of(50L), watch.featureIds());
        assertEquals(
                "фирменные часы, подарочная упаковка, брендированный пакет, инструкция, гарантия 1 год.",
                watch.packageContents()
        );
        assertNull(watch.strapColorId());
        assertNull(watch.dialColorId());
        assertTrue(response.mappedCharacteristics().stream().anyMatch(item ->
                item.sourceLabel().equals("Модель")
                        && item.targetField().equals("model")
                        && item.resolvedValue().equals("2616")));
        assertEquals(2, response.mappedCharacteristics().stream().filter(item ->
                item.targetField().equals("watchDetails.waterResistanceId")).count());
        assertTrue(response.unmappedCharacteristics().stream().anyMatch(item ->
                item.sourceLabel().equals("Цвет") && item.sourceValue().equals("Черный")));
        assertTrue(response.unmappedCharacteristics().stream().anyMatch(item ->
                item.sourceLabel().equals("Страна производства")));
        assertTrue(response.unmappedCharacteristics().stream().anyMatch(item ->
                item.sourceLabel().equals("Противоударные") && item.sourceValue().equals("Нет")));
        assertEquals(
                parsed.characteristics().size(),
                response.mappedCharacteristics().size()
                        + response.unmappedCharacteristics().size()
                        + response.unresolvedCharacteristics().size()
        );
    }

    @Test
    void mapsSourceSpecificAliasesColorsWaterAndMultipleFeatureSeparators() {
        KaspiProductImportResponse response = map(product(List.of(
                new KaspiCharacteristic("Пол", "Мужские"),
                new KaspiCharacteristic("Материал ремешка", "Нержавеющая сталь"),
                new KaspiCharacteristic("Вид стекла", "Минеральное"),
                new KaspiCharacteristic("Диаметр циферблата", "41,00 mm"),
                new KaspiCharacteristic("Механизм часов", "Кварцевые"),
                new KaspiCharacteristic("Тип отображения времени", "Аналоговый (стрелки)"),
                new KaspiCharacteristic("Тип цифр", "Римские"),
                new KaspiCharacteristic("Источник питания", "Батарейка"),
                new KaspiCharacteristic("Цвет браслета", "Черный"),
                new KaspiCharacteristic("Цвет циферблата", "Белый"),
                new KaspiCharacteristic(
                        "Особенности",
                        "Функции: Лунный календарь • Хронограф / Секундомер; Дата|Будильник, Подсветка\nGMT"
                )
        )));

        KaspiProductImportResponse.WatchDetails watch = response.values().watchDetails();
        assertEquals(6L, watch.genderId());
        assertEquals(2L, watch.strapMaterialId());
        assertEquals(4L, watch.glassTypeId());
        assertEquals(41, watch.caseSizeMm());
        assertEquals(5L, watch.mechanismId());
        assertEquals(30L, watch.dialTypeId());
        assertEquals(31L, watch.dialMarkingId());
        assertEquals(32L, watch.powerSourceId());
        assertEquals(40L, watch.strapColorId());
        assertEquals(41L, watch.dialColorId());
        assertEquals(Set.of(50L, 51L, 52L, 53L, 54L, 55L, 56L), Set.copyOf(watch.featureIds()));
        assertEquals(11, response.mappedCharacteristics().size());
        assertTrue(response.unmappedCharacteristics().isEmpty());
        assertTrue(response.unresolvedCharacteristics().isEmpty());
    }

    @Test
    void normalizesSupportedWaterVariantsAndLeavesConflictingValuesUnresolved() {
        List<String> variants = List.of(
                "WR30 (3 атм)", "3 ATM", "30 м", "WR 50", "5 атм", "50m",
                "WR100", "10 атм", "100 м", "WR 200", "20 atm", "200m"
        );
        List<Long> expectedIds = List.of(33L, 33L, 33L, 34L, 34L, 34L, 35L, 35L, 35L, 36L, 36L, 36L);
        for (int index = 0; index < variants.size(); index++) {
            KaspiProductImportResponse response = map(product(List.of(
                    new KaspiCharacteristic("Водозащита", variants.get(index))
            )));
            assertEquals(expectedIds.get(index), response.values().watchDetails().waterResistanceId(), variants.get(index));
        }

        KaspiProductImportResponse conflicting = map(product(List.of(
                new KaspiCharacteristic("Водонепроницаемость", "WR30"),
                new KaspiCharacteristic("Класс водонепроницаемости", "WR50")
        )));

        assertNull(conflicting.values().watchDetails().waterResistanceId());
        assertEquals(2, conflicting.unresolvedCharacteristics().size());
        assertTrue(conflicting.unresolvedCharacteristics().stream().allMatch(item ->
                item.targetField().equals("watchDetails.waterResistanceId")
                        && item.reason().equals("DUPLICATE_CONFLICT")));
        assertTrue(conflicting.mappedCharacteristics().isEmpty());
    }

    @Test
    void rejectsUnsafeCaseUnitsAndNegativeOrUnknownFeatureValues() {
        for (String size : List.of("4.1 см", "41", "diameter 41 mm approximately")) {
            KaspiProductImportResponse response = map(product(List.of(
                    new KaspiCharacteristic("Размер корпуса", size)
            )));
            assertNull(response.values().watchDetails().caseSizeMm(), size);
            assertEquals("INVALID_VALUE", response.unresolvedCharacteristics().get(0).reason(), size);
        }

        for (String features : List.of("Нет", "Хронограф, неизвестная функция")) {
            KaspiProductImportResponse response = map(product(List.of(
                    new KaspiCharacteristic("Функции", features)
            )));
            assertTrue(response.values().watchDetails().featureIds().isEmpty(), features);
            assertEquals(1, response.unresolvedCharacteristics().size(), features);
        }
    }

    @Test
    void leavesAmbiguousColorUnsupportedShapeAndWristwatchCountryUnmapped() {
        KaspiProductImportResponse response = map(product(List.of(
                new KaspiCharacteristic("Цвет", "Черный"),
                new KaspiCharacteristic("Форма", "Круглая"),
                new KaspiCharacteristic("Страна производства", "Южная Корея")
        )));

        assertNull(response.values().watchDetails().strapColorId());
        assertNull(response.values().watchDetails().dialColorId());
        assertEquals(
                Set.of("Цвет", "Форма", "Страна производства"),
                response.unmappedCharacteristics().stream()
                        .map(KaspiProductImportResponse.UnmappedCharacteristic::sourceLabel)
                        .collect(java.util.stream.Collectors.toSet())
        );
        assertTrue(response.mappedCharacteristics().isEmpty());
        assertTrue(response.unresolvedCharacteristics().isEmpty());
    }

    private KaspiProductImportResponse map(KaspiParsedProduct product) {
        return mapper.map(product, SOURCE_URL, 77L, CatalogCategoryProfile.WRISTWATCH, references());
    }

    private KaspiParsedProduct product(List<KaspiCharacteristic> characteristics) {
        return new KaspiParsedProduct(
                "Romanson 2616", "Romanson", null, 42_000,
                "Must never be imported from Wildberries", characteristics, List.of()
        );
    }

    private CrmReferencesResponse references() {
        return new CrmReferencesResponse(
                List.of(),
                List.of(new CrmBrandReferenceOptionResponse(10L, "Romanson", "ROMANSON", 20L, "KR", "Корея")),
                List.of(),
                List.of(new CrmReferenceOptionResponse(5L, "Кварцевый", "QUARTZ")),
                List.of(new CrmReferenceOptionResponse(6L, "Мужские", "MEN")),
                List.of(
                        new CrmReferenceOptionResponse(1L, "Стальной", "STEEL"),
                        new CrmReferenceOptionResponse(2L, "Нержавеющая сталь", "STAINLESS_STEEL")
                ),
                List.of(new CrmReferenceOptionResponse(4L, "Минеральное", "MINERAL")),
                List.of(),
                List.of(new CrmReferenceOptionResponse(20L, "Корея", "KR")),
                List.of(
                        new CrmReferenceOptionResponse(40L, "Черный", "BLACK"),
                        new CrmReferenceOptionResponse(41L, "Белый", "WHITE")
                ),
                List.of(),
                List.of(),
                List.of(),
                List.of(new CrmReferenceOptionResponse(30L, "Аналоговый (стрелки)", "ANALOG")),
                List.of(new CrmReferenceOptionResponse(31L, "Римские цифры", "ROMAN")),
                List.of(new CrmReferenceOptionResponse(32L, "От батарейки", "BATTERY")),
                List.of(
                        new CrmReferenceOptionResponse(33L, "WR30 (3 атм)", "WR30"),
                        new CrmReferenceOptionResponse(34L, "WR50 (5 атм)", "WR50"),
                        new CrmReferenceOptionResponse(35L, "WR100 (10 атм)", "WR100"),
                        new CrmReferenceOptionResponse(36L, "WR200 (20 атм)", "WR200")
                ),
                List.of(
                        new CrmReferenceOptionResponse(50L, "Фаза луны", "MOON_PHASE"),
                        new CrmReferenceOptionResponse(51L, "Хронограф", "CHRONOGRAPH"),
                        new CrmReferenceOptionResponse(52L, "Секундомер", "STOPWATCH"),
                        new CrmReferenceOptionResponse(53L, "Отображение даты", "DATE"),
                        new CrmReferenceOptionResponse(54L, "Будильник", "ALARM"),
                        new CrmReferenceOptionResponse(55L, "Подсветка", "BACKLIGHT"),
                        new CrmReferenceOptionResponse(56L, "Второй часовой пояс", "GMT")
                )
        );
    }

    private String fixture(String name) throws IOException {
        try (var stream = getClass().getResourceAsStream("/fixtures/wildberries/" + name)) {
            if (stream == null) throw new IOException("Missing fixture " + name);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
