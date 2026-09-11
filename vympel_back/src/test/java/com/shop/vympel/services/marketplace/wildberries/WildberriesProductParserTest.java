package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.services.marketplace.kaspi.KaspiParsedProduct;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WildberriesProductParserTest {
    private final WildberriesProductParser parser = new WildberriesProductParser(new ObjectMapper());

    @Test
    void parsesCurrentPriceAndUsesAConservativeTitleModelWithoutImportingDescription() throws Exception {
        WildberriesParsedProduct parsed = parser.parse(fixture("card-v4.json"), fixture("card-detail.json"), 320159542L);
        KaspiParsedProduct product = parsed.product();

        assertEquals("Часы Кварцевые ROMANSON RM8A46 BLUE нержавеющая сталь", product.name());
        assertEquals("Romanson", product.brand());
        assertEquals("RM8A46", product.model());
        assertEquals(38_280, product.price());
        assertEquals("Часы наручные", parsed.sourceCategory());
        assertNull(product.description());
        assertTrue(product.characteristics().stream().anyMatch(item ->
                item.label().equals("Механизм часов") && item.value().equals("кварцевый")));
        assertTrue(product.characteristics().stream().anyMatch(item ->
                item.label().equals("Артикул Wildberries") && item.value().equals("320159542")));
        assertFalse(product.characteristics().stream().anyMatch(item -> item.label().toLowerCase().contains("фото")));
        assertTrue(product.warnings().contains("MODEL_FROM_TITLE"));
        assertFalse(product.warnings().contains("DESCRIPTION_NOT_FOUND"));
    }

    @Test
    void keepsTheSanitizedArticleCharacteristicsStructuredAndPrefersItsExactModelOption() throws Exception {
        WildberriesParsedProduct parsed = parser.parse(
                fixture("card-v4-322229674.json"), fixture("card-detail-322229674.json"), 322229674L
        );
        KaspiParsedProduct product = parsed.product();

        assertNull(product.description());
        assertEquals("2616", product.model());
        assertFalse(product.warnings().contains("MODEL_FROM_TITLE"));
        assertTrue(product.characteristics().stream().anyMatch(item ->
                item.label().equals("Функции") && item.value().equals("Индикатор фазы луны")));
        assertTrue(product.characteristics().stream().anyMatch(item ->
                item.label().equals("Водонепроницаемость")
                        && item.value().startsWith("WR30 (3 атм)")));
        assertTrue(product.characteristics().stream().anyMatch(item ->
                item.label().equals("Комплектация") && item.value().startsWith("Комплектация:")));
    }

    @Test
    void usesOnlyAnUnambiguousMixedLetterDigitTitleTokenAsFallback() {
        String catalog = "{\"products\":[{\"id\":42,\"brand\":\"Brand\",\"name\":\"Часы AB-123 синие\",\"sizes\":[{\"price\":{\"product\":10000}}]}]}";
        String details = "{\"nm_id\":42,\"imt_name\":\"Часы AB-123 синие\",\"description\":\"Описание\",\"options\":[]}";

        KaspiParsedProduct product = parser.parse(catalog, details, 42L).product();

        assertEquals("AB-123", product.model());
        assertTrue(product.warnings().contains("MODEL_FROM_TITLE"));
    }

    @Test
    void preservesAShortUppercaseModelPrefixWithoutMergingOtherTitleWords() {
        String catalog = "{\"products\":[{\"id\":42,\"name\":\"Часы TM 9A28M BLUE\",\"sizes\":[{\"price\":{\"product\":10000}}]}]}";
        String details = "{\"nm_id\":42,\"imt_name\":\"Часы TM 9A28M BLUE\",\"description\":\"Описание\",\"options\":[]}";

        KaspiParsedProduct product = parser.parse(catalog, details, 42L).product();

        assertEquals("TM 9A28M", product.model());
        assertTrue(product.warnings().contains("MODEL_FROM_TITLE"));
    }

    @Test
    void refusesAmbiguousModelsAndDifferentCurrentPrices() {
        String catalog = "{\"products\":[{\"id\":42,\"name\":\"Часы AB-123 CD-456\",\"sizes\":[{\"price\":{\"product\":10000}},{\"price\":{\"product\":20000}}]}]}";
        String details = "{\"nm_id\":42,\"imt_name\":\"Часы AB-123 CD-456\",\"description\":\"Описание\",\"options\":[]}";

        KaspiParsedProduct product = parser.parse(catalog, details, 42L).product();

        assertNull(product.model());
        assertNull(product.price());
        assertTrue(product.warnings().contains("MODEL_AMBIGUOUS"));
        assertTrue(product.warnings().contains("PRICE_AMBIGUOUS"));
    }

    @Test
    void refusesConflictingExactModelsWithoutFallingBackToTheTitle() {
        String catalog = "{\"products\":[{\"id\":42,\"name\":\"Часы AB-123\",\"sizes\":[{\"price\":{\"product\":10000}}]}]}";
        String details = "{\"nm_id\":42,\"imt_name\":\"Часы AB-123\",\"description\":\"Описание\",\"options\":["
                + "{\"name\":\"Модель\",\"value\":\"RM 1\"},"
                + "{\"name\":\"Model\",\"value\":\"RM 2\"}]}";

        KaspiParsedProduct product = parser.parse(catalog, details, 42L).product();

        assertNull(product.model());
        assertTrue(product.warnings().contains("MODEL_AMBIGUOUS"));
        assertFalse(product.warnings().contains("MODEL_FROM_TITLE"));
    }

    private String fixture(String name) throws IOException {
        try (var stream = getClass().getResourceAsStream("/fixtures/wildberries/" + name)) {
            if (stream == null) throw new IOException("Missing fixture " + name);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
