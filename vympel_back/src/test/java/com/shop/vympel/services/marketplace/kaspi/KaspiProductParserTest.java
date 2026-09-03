package com.shop.vympel.services.marketplace.kaspi;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KaspiProductParserTest {
    private final KaspiProductParser parser = new KaspiProductParser(new ObjectMapper());

    @Test
    void parsesStructuredProductFieldsAndServerRenderedCharacteristics() throws IOException {
        KaspiParsedProduct product = parser.parse(
                fixture("fixtures/kaspi/watch-product.html"),
                "https://kaspi.kz/shop/p/watch-123"
        );

        assertEquals("Romanson Heritage White", product.name());
        assertEquals("Romanson", product.brand());
        assertEquals("TM9A19MMW", product.model());
        assertEquals(129_990, product.price());
        assertEquals("Классические мужские часы с кожаным ремешком.", product.description());
        assertTrue(product.characteristics().contains(new KaspiCharacteristic("Материал корпуса", "нерж. сталь")));
        assertTrue(product.characteristics().contains(new KaspiCharacteristic("Диаметр корпуса", "40 мм")));
        assertTrue(product.characteristics().contains(new KaspiCharacteristic("Неизвестный параметр", "исходное значение")));
    }

    @Test
    void malformedStructuredDataFallsBackToSemanticDomAndReportsPartialData() {
        String html = "<script type='application/ld+json'>{broken</script>"
                + "<h1>Fallback watch</h1><dl><dt>Стекло</dt><dd>минеральное</dd></dl>";
        KaspiParsedProduct product = parser.parse(html, "https://kaspi.kz/shop/p/fallback");

        assertEquals("Fallback watch", product.name());
        assertEquals(null, product.price());
        assertTrue(product.warnings().contains("PRICE_NOT_FOUND"));
        assertEquals(1, product.characteristics().size());
    }

    @Test
    void decodesHtmlEntitiesAndKeepsUntrustedDescriptionAsPlainImportedData() {
        String html = "<script type='application/ld+json'>"
                + "{\"@type\":\"Product\",\"name\":\"A &amp; B\","
                + "\"description\":\"&lt;img src=x onerror=alert(1)&gt; **safe markdown**\"}"
                + "</script>";

        KaspiParsedProduct product = parser.parse(html, "https://kaspi.kz/shop/p/entities");

        assertEquals("A & B", product.name());
        assertEquals("<img src=x onerror=alert(1)> **safe markdown**", product.description());
    }

    @Test
    void conflictingPricesAreNotGuessed() {
        String html = "<script type='application/ld+json'>{\"@type\":\"Product\",\"name\":\"Watch\","
                + "\"offers\":{\"price\":\"10000\"}}</script><span itemprop='price'>12000 ₸</span>";
        KaspiParsedProduct product = parser.parse(html, "https://kaspi.kz/shop/p/ambiguous");

        assertEquals(null, product.price());
        assertTrue(product.warnings().contains("PRICE_AMBIGUOUS"));
    }

    @Test
    void skipsAggregateSpecificationContainersInsteadOfConcatenatingNestedRows() {
        String html = "<h1>Watch</h1>"
                + "<div class='specifications-group'>"
                + "<div class='specifications-row'>"
                + "<span class='specifications-label'>Конструкция</span>"
                + "<div class='specifications-value'>"
                + "<div class='specifications-row'><span class='specifications-label'>Форма</span>"
                + "<span class='specifications-value'>круг</span></div>"
                + "<div class='specifications-row'><span class='specifications-label'>Вес</span>"
                + "<span class='specifications-value'>500 г</span></div>"
                + "</div></div></div>";

        KaspiParsedProduct product = parser.parse(html, "https://kaspi.kz/shop/p/nested");

        assertTrue(product.characteristics().contains(new KaspiCharacteristic("Форма", "круг")));
        assertTrue(product.characteristics().contains(new KaspiCharacteristic("Вес", "500 г")));
        assertFalse(product.characteristics().stream().anyMatch(item -> item.label().equals("Конструкция")));
        assertFalse(product.characteristics().stream().anyMatch(item -> item.value().contains("Форма круг Вес")));
    }

    @Test
    void parsesKazakhstaniIntegerPricesWithoutDecimalCorruption() {
        assertEquals(119_950, KaspiProductParser.parsePrice("119 950 ₸"));
        assertEquals(119_950, KaspiProductParser.parsePrice("119\u00a0950 тг"));
        assertEquals(119_950, KaspiProductParser.parsePrice("119950.00"));
        assertEquals(119_950, KaspiProductParser.parsePrice("119 950,00 ₸"));
        assertEquals(119_950, KaspiProductParser.parsePrice("119.950"));
        assertNull(KaspiProductParser.parsePrice("119950.50"));
        assertNull(KaspiProductParser.parsePrice("12.34.567 ₸"));
        assertNull(KaspiProductParser.parsePrice("119.950,000 ₸"));
        assertNull(KaspiProductParser.parsePrice("-100 ₸"));
        assertNull(KaspiProductParser.parsePrice("999999999999 ₸"));
        assertNull(KaspiProductParser.parsePrice("1e9 ₸"));
        assertNull(KaspiProductParser.parsePrice("от 100000 до 120000 ₸"));
    }

    private String fixture(String path) throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(path)) {
            if (stream == null) throw new IOException("Missing fixture: " + path);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
