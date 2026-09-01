package com.shop.vympel.services.marketplace.kaspi;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    void conflictingPricesAreNotGuessed() {
        String html = "<script type='application/ld+json'>{\"@type\":\"Product\",\"name\":\"Watch\","
                + "\"offers\":{\"price\":\"10000\"}}</script><span itemprop='price'>12000 ₸</span>";
        KaspiParsedProduct product = parser.parse(html, "https://kaspi.kz/shop/p/ambiguous");

        assertEquals(null, product.price());
        assertTrue(product.warnings().contains("PRICE_AMBIGUOUS"));
    }

    private String fixture(String path) throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(path)) {
            if (stream == null) throw new IOException("Missing fixture: " + path);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
