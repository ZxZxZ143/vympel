package com.shop.vympel.services.marketplace.kaspi;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class KaspiProductParser {
    private static final Pattern INTEGER_PATTERN = Pattern.compile("(?<!\\d)(\\d[\\d\\s\\u00a0.,]*)(?!\\d)");
    private static final Set<String> CHARACTERISTIC_CONTAINER_KEYS = Set.of(
            "characteristics", "specifications", "attributes", "properties"
    );
    private final ObjectMapper objectMapper;

    public KaspiProductParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public KaspiParsedProduct parse(String html, String sourceUrl) {
        Document document = Jsoup.parse(html == null ? "" : html, sourceUrl);
        ParsedAccumulator parsed = new ParsedAccumulator();

        for (Element script : document.select("script[type=application/ld+json]")) {
            readJson(script.data().isBlank() ? script.html() : script.data(), parsed, true);
        }
        for (Element script : document.select("script[type=application/json], script:not([type])")) {
            String json = script.data().isBlank() ? script.html() : script.data();
            if (looksLikeJson(json)) {
                readJson(json, parsed, false);
            }
        }

        parsed.name = firstNonBlank(
                parsed.name,
                metaContent(document, "meta[property=og:title]"),
                text(document.selectFirst("h1"))
        );
        parsed.description = firstNonBlank(
                parsed.description,
                metaContent(document, "meta[itemprop=description]"),
                text(document.selectFirst("[itemprop=description]")),
                text(document.selectFirst(".description"))
        );

        addPriceCandidate(parsed, metaContent(document, "meta[itemprop=price]"));
        addPriceCandidate(parsed, attribute(document.selectFirst("[itemprop=price]"), "content"));
        addPriceCandidate(parsed, text(document.selectFirst("[itemprop=price]")));
        addPriceCandidate(parsed, text(document.selectFirst(".item__price-once")));
        addPriceCandidate(parsed, text(document.selectFirst(".price")));

        readDefinitionLists(document, parsed);
        readTables(document, parsed);
        readKaspiSpecificationRows(document, parsed);

        Integer price = null;
        if (parsed.prices.size() == 1) {
            price = parsed.prices.iterator().next();
        } else if (parsed.prices.size() > 1) {
            parsed.warnings.add("PRICE_AMBIGUOUS");
        } else {
            parsed.warnings.add("PRICE_NOT_FOUND");
        }
        if (parsed.characteristics.isEmpty()) {
            parsed.warnings.add("CHARACTERISTICS_NOT_FOUND");
        }
        if (blank(parsed.description)) {
            parsed.warnings.add("DESCRIPTION_NOT_FOUND");
        }

        return new KaspiParsedProduct(
                clean(parsed.name, 500),
                clean(parsed.brand, 200),
                clean(parsed.model, 200),
                price,
                clean(parsed.description, 10_000),
                List.copyOf(parsed.characteristics.values()),
                List.copyOf(parsed.warnings)
        );
    }

    private void readJson(String rawJson, ParsedAccumulator parsed, boolean structuredData) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            if (structuredData) {
                forEachProduct(root, node -> readProductNode(node, parsed));
            }
            readCharacteristicContainers(root, parsed);
        } catch (Exception ignored) {
            // Malformed optional page JSON must not prevent DOM fallback parsing.
        }
    }

    private void forEachProduct(JsonNode node, java.util.function.Consumer<JsonNode> consumer) {
        if (node == null) return;
        if (node.isArray()) {
            node.forEach(child -> forEachProduct(child, consumer));
            return;
        }
        if (!node.isObject()) return;
        JsonNode type = node.get("@type");
        if (isProductType(type)) consumer.accept(node);
        node.properties().forEach(entry -> forEachProduct(entry.getValue(), consumer));
    }

    private boolean isProductType(JsonNode type) {
        if (type == null) return false;
        if (type.isArray()) {
            for (JsonNode item : type) {
                if ("product".equalsIgnoreCase(item.asText())) return true;
            }
        }
        return "product".equalsIgnoreCase(type.asText());
    }

    private void readProductNode(JsonNode product, ParsedAccumulator parsed) {
        parsed.name = firstNonBlank(parsed.name, scalar(product.get("name")));
        parsed.model = firstNonBlank(parsed.model, scalar(product.get("model")), scalar(product.get("mpn")));
        parsed.description = firstNonBlank(parsed.description, scalar(product.get("description")));
        JsonNode brand = product.get("brand");
        parsed.brand = firstNonBlank(parsed.brand,
                brand != null && brand.isObject() ? scalar(brand.get("name")) : scalar(brand));

        JsonNode offers = product.get("offers");
        if (offers != null) {
            if (offers.isArray()) offers.forEach(offer -> readOffer(offer, parsed));
            else readOffer(offers, parsed);
        }
        JsonNode properties = product.get("additionalProperty");
        if (properties != null) readCharacteristicCollection(properties, parsed);
    }

    private void readOffer(JsonNode offer, ParsedAccumulator parsed) {
        if (offer == null) return;
        addPriceCandidate(parsed, scalar(offer.get("price")));
        addPriceCandidate(parsed, scalar(offer.get("lowPrice")));
    }

    private void readCharacteristicContainers(JsonNode node, ParsedAccumulator parsed) {
        if (node == null) return;
        if (node.isArray()) {
            node.forEach(child -> readCharacteristicContainers(child, parsed));
            return;
        }
        if (!node.isObject()) return;
        node.properties().forEach(entry -> {
            String key = normalizeKey(entry.getKey());
            if (CHARACTERISTIC_CONTAINER_KEYS.contains(key)) {
                readCharacteristicCollection(entry.getValue(), parsed);
            }
            readCharacteristicContainers(entry.getValue(), parsed);
        });
    }

    private void readCharacteristicCollection(JsonNode node, ParsedAccumulator parsed) {
        if (node == null) return;
        if (node.isArray()) {
            node.forEach(child -> readCharacteristicCollection(child, parsed));
            return;
        }
        if (!node.isObject()) return;

        String label = firstNonBlank(
                scalar(node.get("name")), scalar(node.get("label")), scalar(node.get("title")), scalar(node.get("key"))
        );
        String value = firstNonBlank(
                scalar(node.get("value")), scalar(node.get("text")), scalar(node.get("displayValue"))
        );
        if (!blank(label) && !blank(value)) {
            addCharacteristic(parsed, label, value);
            return;
        }
        node.properties().forEach(entry -> {
            JsonNode child = entry.getValue();
            if (child.isValueNode()) addCharacteristic(parsed, entry.getKey(), child.asText());
            else readCharacteristicCollection(child, parsed);
        });
    }

    private void readDefinitionLists(Document document, ParsedAccumulator parsed) {
        for (Element term : document.select("dt")) {
            Element value = term.nextElementSibling();
            if (value != null && "dd".equalsIgnoreCase(value.tagName())) {
                addCharacteristic(parsed, term.text(), value.text());
            }
        }
    }

    private void readTables(Document document, ParsedAccumulator parsed) {
        for (Element row : document.select("table tr")) {
            List<Element> cells = row.select("th,td");
            if (cells.size() >= 2) addCharacteristic(parsed, cells.get(0).text(), cells.get(1).text());
        }
    }

    private void readKaspiSpecificationRows(Document document, ParsedAccumulator parsed) {
        for (Element row : document.select(".specifications-list__spec, [class*=specification]")) {
            Element label = row.selectFirst(".specifications-list__spec-term, [class*=term], [class*=label]");
            Element value = row.selectFirst(".specifications-list__spec-definition, [class*=definition], [class*=value]");
            if (label != null && value != null) addCharacteristic(parsed, label.text(), value.text());
        }
    }

    private void addCharacteristic(ParsedAccumulator parsed, String rawLabel, String rawValue) {
        String label = clean(rawLabel, 300);
        String value = clean(rawValue, 1000);
        if (blank(label) || blank(value)) return;
        parsed.characteristics.putIfAbsent(label + "\u0000" + value, new KaspiCharacteristic(label, value));
    }

    private void addPriceCandidate(ParsedAccumulator parsed, String raw) {
        Integer value = parsePrice(raw);
        if (value != null) parsed.prices.add(value);
    }

    static Integer parsePrice(String raw) {
        if (blank(raw)) return null;
        Matcher matcher = INTEGER_PATTERN.matcher(raw);
        if (!matcher.find()) return null;
        String digits = matcher.group(1).replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return null;
        try {
            long value = Long.parseLong(digits);
            return value >= 0 && value <= Integer.MAX_VALUE ? (int) value : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String scalar(JsonNode node) {
        return node != null && node.isValueNode() ? node.asText() : null;
    }

    private String metaContent(Document document, String selector) {
        return attribute(document.selectFirst(selector), "content");
    }

    private String attribute(Element element, String attribute) {
        return element == null ? null : element.attr(attribute);
    }

    private String text(Element element) {
        return element == null ? null : element.text();
    }

    private boolean looksLikeJson(String value) {
        if (value == null) return false;
        String trimmed = value.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!blank(value)) return value;
        }
        return null;
    }

    private static String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String clean(String value, int maxLength) {
        if (value == null) return null;
        String cleaned = value.replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
        if (cleaned.isBlank()) return null;
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength).trim();
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static final class ParsedAccumulator {
        private String name;
        private String brand;
        private String model;
        private String description;
        private final Set<Integer> prices = new LinkedHashSet<>();
        private final Map<String, KaspiCharacteristic> characteristics = new LinkedHashMap<>();
        private final Set<String> warnings = new LinkedHashSet<>();
    }
}
