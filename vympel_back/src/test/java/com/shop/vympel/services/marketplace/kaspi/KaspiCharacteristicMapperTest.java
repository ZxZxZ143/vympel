package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    private KaspiParsedProduct product(List<KaspiCharacteristic> characteristics) {
        return new KaspiParsedProduct(
                "Romanson Heritage", "Romanson", "TM9", 129_990, "Описание", characteristics, List.of()
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
                        new CrmReferenceOptionResponse(2L, "Нержавеющая сталь", "STAINLESS_STEEL"),
                        new CrmReferenceOptionResponse(3L, "Кожаный", "LEATHER")
                ),
                List.of(new CrmReferenceOptionResponse(4L, "Минеральное", "MINERAL")),
                List.of(),
                List.of(new CrmReferenceOptionResponse(20L, "Корея", "KR")),
                List.of(new CrmReferenceOptionResponse(7L, "Серебристый", "SILVER")),
                List.of(),
                List.of(new CrmReferenceOptionResponse(8L, "Кварцевый", "QUARTZ")),
                List.of(new CrmReferenceOptionResponse(9L, "Батарейка", "BATTERY"))
        );
    }
}
