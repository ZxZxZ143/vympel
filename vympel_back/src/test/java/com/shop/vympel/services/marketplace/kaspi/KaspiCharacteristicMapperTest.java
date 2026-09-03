package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KaspiCharacteristicMapperTest {
    private final KaspiCharacteristicMapper mapper = new KaspiCharacteristicMapper();

    @Test
    void mapsNormalizedWatchLabelsAliasesAndStainlessSteelToItsDistinctDictionaryId() {
        KaspiParsedProduct parsed = product(List.of(
                new KaspiCharacteristic(" Материал  корпуса: ", "нерж. сталь"),
                new KaspiCharacteristic("Материал ремешка", "натуральная кожа"),
                new KaspiCharacteristic("ТИП СТЕКЛА", "минеральное"),
                new KaspiCharacteristic("Механизм", "кварцевые"),
                new KaspiCharacteristic("Для кого", "для мужчин"),
                new KaspiCharacteristic("Размер корпуса", "40 мм"),
                new KaspiCharacteristic("Цвет", "серебристый")
        ));

        KaspiProductImportResponse response = mapper.map(
                parsed, "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );

        assertEquals(2L, response.values().watchDetails().caseMaterialId());
        assertEquals(3L, response.values().watchDetails().strapMaterialId());
        assertEquals(4L, response.values().watchDetails().glassTypeId());
        assertEquals(5L, response.values().watchDetails().mechanismId());
        assertEquals(6L, response.values().watchDetails().genderId());
        assertEquals(40, response.values().watchDetails().caseSizeMm());
        assertTrue(response.unmappedCharacteristics().stream().anyMatch(item ->
                item.sourceLabel().equals("Цвет") && item.reason().equals("UNSUPPORTED_FOR_CATEGORY")));
        assertTrue(response.mappedCharacteristics().stream().anyMatch(item ->
                item.targetField().equals("watchDetails.caseMaterialId")
                        && item.resolvedValue().equals("Нержавеющая сталь")
                        && item.resolution().equals("ALIAS")));
    }

    @Test
    void leavesUnknownDictionaryValuesUnresolvedAndDoesNotPopulateThem() {
        KaspiProductImportResponse response = mapper.map(
                product(List.of(
                        new KaspiCharacteristic("Материал корпуса", "адамант"),
                        new KaspiCharacteristic("Неизвестный параметр", "значение")
                )),
                "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );

        assertNull(response.values().watchDetails().caseMaterialId());
        assertTrue(response.unresolvedCharacteristics().stream().anyMatch(item ->
                item.sourceValue().equals("адамант") && item.reason().equals("UNRESOLVED_VALUE")));
        assertTrue(response.unmappedCharacteristics().stream().anyMatch(item ->
                item.sourceLabel().equals("Неизвестный параметр") && item.reason().equals("UNKNOWN_LABEL")));
    }

    @Test
    void selectedCategoryProfileControlsWhichTechnicalFieldsCanBeApplied() {
        KaspiProductImportResponse response = mapper.map(
                product(List.of(
                        new KaspiCharacteristic("Цвет", "серебристый"),
                        new KaspiCharacteristic("Механизм", "кварцевый"),
                        new KaspiCharacteristic("Материал ремешка", "кожа")
                )),
                "https://kaspi.kz/shop/p/clock-123", 88L,
                CatalogCategoryProfile.INTERIOR_CLOCK, references()
        );

        assertEquals(7L, response.values().interiorClockDetails().colorId());
        assertEquals(8L, response.values().interiorClockDetails().mechanismTypeId());
        assertTrue(response.unmappedCharacteristics().stream().anyMatch(item ->
                item.sourceLabel().equals("Материал ремешка")
                        && item.reason().equals("UNSUPPORTED_FOR_CATEGORY")));
    }

    @Test
    void normalSteelNeverWinsTheStainlessAlias() {
        KaspiProductImportResponse response = mapper.map(
                product(List.of(new KaspiCharacteristic("Материал корпуса", "stainless steel"))),
                "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );
        assertEquals(2L, response.values().watchDetails().caseMaterialId());
    }

    @Test
    void keepsPlainSteelDistinctFromEverySupportedStainlessAlias() {
        for (String value : List.of("нерж. сталь", "нерж сталь", "нержавеющая сталь", "stainless steel")) {
            KaspiProductImportResponse response = mapper.map(
                    product(List.of(new KaspiCharacteristic("Материал корпуса", value))),
                    "https://kaspi.kz/shop/p/watch-123", 77L,
                    CatalogCategoryProfile.WRISTWATCH, references()
            );
            assertEquals(2L, response.values().watchDetails().caseMaterialId(), value);
        }
        KaspiProductImportResponse steel = mapper.map(
                product(List.of(new KaspiCharacteristic("Материал корпуса", "сталь"))),
                "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );
        assertEquals(1L, steel.values().watchDetails().caseMaterialId());
    }

    @Test
    void reportsEveryConflictingSourceWithoutApplyingTheTarget() {
        KaspiProductImportResponse response = mapper.map(
                product(List.of(
                        new KaspiCharacteristic("Материал корпуса", "сталь"),
                        new KaspiCharacteristic("Материал корпуса", "нержавеющая сталь"),
                        new KaspiCharacteristic("Материал корпуса", "кожа")
                )),
                "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );

        assertNull(response.values().watchDetails().caseMaterialId());
        assertEquals(List.of("сталь", "нержавеющая сталь", "кожа"),
                response.unresolvedCharacteristics().stream()
                        .filter(item -> item.targetField().equals("watchDetails.caseMaterialId"))
                        .map(KaspiProductImportResponse.UnresolvedCharacteristic::sourceValue)
                        .toList());
        assertTrue(response.unresolvedCharacteristics().stream()
                .allMatch(item -> item.reason().equals("DUPLICATE_CONFLICT")));
    }

    @Test
    void doesNotMarkValuesMappedWhenTheyExceedTheNormalCreateLimits() {
        KaspiParsedProduct longName = new KaspiParsedProduct(
                "N".repeat(256), "Romanson", "TM9", 129_990, "Описание", List.of(), List.of()
        );
        KaspiProductImportResponse core = mapper.map(
                longName, "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );
        assertNull(core.values().nameRu());
        assertTrue(core.unresolvedCharacteristics().stream().anyMatch(item ->
                item.targetField().equals("nameRu") && item.reason().equals("INVALID_VALUE")));

        KaspiParsedProduct longTextFields = new KaspiParsedProduct(
                "Valid name", "Romanson", "M".repeat(256), 129_990,
                "D".repeat(10_001), List.of(), List.of()
        );
        KaspiProductImportResponse textFields = mapper.map(
                longTextFields, "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );
        assertNull(textFields.values().model());
        assertNull(textFields.values().descriptionRu());
        assertEquals(Set.of("model", "descriptionRu"), textFields.unresolvedCharacteristics().stream()
                .filter(item -> item.reason().equals("INVALID_VALUE"))
                .map(KaspiProductImportResponse.UnresolvedCharacteristic::targetField)
                .collect(java.util.stream.Collectors.toSet()));

        KaspiProductImportResponse watch = mapper.map(
                product(List.of(new KaspiCharacteristic("Водонепроницаемость", "W".repeat(51)))),
                "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );
        assertNull(watch.values().watchDetails().waterResistance());

        KaspiProductImportResponse interior = mapper.map(
                product(List.of(new KaspiCharacteristic("Размеры", "D".repeat(101)))),
                "https://kaspi.kz/shop/p/clock-123", 88L,
                CatalogCategoryProfile.INTERIOR_CLOCK, references()
        );
        assertNull(interior.values().interiorClockDetails().dimensions());

        KaspiProductImportResponse accessory = mapper.map(
                product(List.of(
                        new KaspiCharacteristic("Тип застежки", "C".repeat(101)),
                        new KaspiCharacteristic("Длина", "L".repeat(101))
                )),
                "https://kaspi.kz/shop/p/accessory-123", 99L,
                CatalogCategoryProfile.ACCESSORY, references()
        );
        assertNull(accessory.values().accessoryDetails().claspType());
        assertNull(accessory.values().accessoryDetails().length());
        assertEquals(2, accessory.unresolvedCharacteristics().stream()
                .filter(item -> item.reason().equals("INVALID_VALUE"))
                .count());
    }

    @Test
    void mapsInteriorCountryOnlyWhenItMatchesTheResolvedBrandCountry() {
        KaspiProductImportResponse matching = mapper.map(
                product("Romanson", List.of(new KaspiCharacteristic("Страна производства", "Корея"))),
                "https://kaspi.kz/shop/p/clock-123", 88L,
                CatalogCategoryProfile.INTERIOR_CLOCK, references()
        );
        assertEquals(20L, matching.values().interiorClockDetails().productionCountryId());

        KaspiProductImportResponse mismatch = mapper.map(
                product("Romanson", List.of(new KaspiCharacteristic("Страна производства", "Япония"))),
                "https://kaspi.kz/shop/p/clock-123", 88L,
                CatalogCategoryProfile.INTERIOR_CLOCK, references()
        );
        assertNull(mismatch.values().interiorClockDetails().productionCountryId());
        assertTrue(mismatch.unresolvedCharacteristics().stream().anyMatch(item ->
                item.reason().equals("BRAND_COUNTRY_MISMATCH")));

        KaspiProductImportResponse missingBrand = mapper.map(
                product(null, List.of(new KaspiCharacteristic("Страна производства", "Корея"))),
                "https://kaspi.kz/shop/p/clock-123", 88L,
                CatalogCategoryProfile.INTERIOR_CLOCK, references()
        );
        assertNull(missingBrand.values().interiorClockDetails().productionCountryId());
        assertFalse(missingBrand.mappedCharacteristics().stream().anyMatch(item ->
                item.targetField().equals("interiorClockDetails.productionCountryId")));
    }

    @Test
    void convertsWholeUnitValuesButDoesNotRoundFractionalTechnicalValues() {
        KaspiProductImportResponse fractionalDiameter = mapper.map(
                product(List.of(new KaspiCharacteristic("Диаметр корпуса", "42,5 мм"))),
                "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );
        assertNull(fractionalDiameter.values().watchDetails().caseSizeMm());

        KaspiProductImportResponse rangedDiameter = mapper.map(
                product(List.of(new KaspiCharacteristic("Диаметр корпуса", "42-44 мм"))),
                "https://kaspi.kz/shop/p/watch-123", 77L,
                CatalogCategoryProfile.WRISTWATCH, references()
        );
        assertNull(rangedDiameter.values().watchDetails().caseSizeMm());

        KaspiProductImportResponse convertedUnits = mapper.map(
                product(List.of(
                        new KaspiCharacteristic("Вес", "0,5 кг"),
                        new KaspiCharacteristic("Гарантия", "1,5 года")
                )),
                "https://kaspi.kz/shop/p/clock-123", 88L,
                CatalogCategoryProfile.INTERIOR_CLOCK, references()
        );
        assertEquals(500, convertedUnits.values().interiorClockDetails().weightGrams());
        assertEquals(18, convertedUnits.values().interiorClockDetails().warrantyMonths());
    }

    private KaspiParsedProduct product(List<KaspiCharacteristic> characteristics) {
        return product("Romanson", characteristics);
    }

    private KaspiParsedProduct product(String brand, List<KaspiCharacteristic> characteristics) {
        return new KaspiParsedProduct(
                "Romanson Heritage", brand, "TM9", 129_990, "Описание", characteristics, List.of()
        );
    }

    private CrmReferencesResponse references() {
        return new CrmReferencesResponse(
                List.of(),
                List.of(
                        new CrmBrandReferenceOptionResponse(10L, "Romanson", "ROMANSON", 20L, "KR", "Корея"),
                        new CrmBrandReferenceOptionResponse(11L, "Casio", "CASIO", 21L, "JP", "Япония")
                ),
                List.of(),
                List.of(new CrmReferenceOptionResponse(5L, "Кварцевый", "QUARTZ")),
                List.of(new CrmReferenceOptionResponse(6L, "Мужские", "MEN")),
                List.of(
                        new CrmReferenceOptionResponse(1L, "Стальной", "STEEL"),
                        new CrmReferenceOptionResponse(2L, "Нержавеющая сталь", "STAINLESS_STEEL"),
                        new CrmReferenceOptionResponse(3L, "Кожаный", "LEATHER")
                ),
                List.of(new CrmReferenceOptionResponse(4L, "Минеральное", "MINERAL")),
                List.of(),
                List.of(
                        new CrmReferenceOptionResponse(20L, "Корея", "KR"),
                        new CrmReferenceOptionResponse(21L, "Япония", "JP")
                ),
                List.of(new CrmReferenceOptionResponse(7L, "Серебристый", "SILVER")),
                List.of(),
                List.of(new CrmReferenceOptionResponse(8L, "Кварцевый", "QUARTZ")),
                List.of(new CrmReferenceOptionResponse(9L, "Батарейка", "BATTERY"))
        );
    }
}
