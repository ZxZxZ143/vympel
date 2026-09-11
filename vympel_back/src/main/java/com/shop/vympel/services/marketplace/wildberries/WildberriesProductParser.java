package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.exceptions.ProductImportException;
import com.shop.vympel.services.marketplace.kaspi.KaspiCharacteristic;
import com.shop.vympel.services.marketplace.kaspi.KaspiParsedProduct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WildberriesProductParser {
    private static final Pattern TITLE_TOKEN = Pattern.compile("(?iu)(?<![\\p{L}\\p{N}])([\\p{L}\\p{N}][\\p{L}\\p{N}._/-]{1,79})(?![\\p{L}\\p{N}])");
    private static final Set<String> MODEL_LABELS = Set.of("модель", "model");
    private final ObjectMapper objectMapper;

    public WildberriesProductParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public WildberriesParsedProduct parse(String catalogJson, String detailsJson, long expectedProductId) {
        try {
            JsonNode catalogRoot = objectMapper.readTree(catalogJson == null ? "" : catalogJson);
            JsonNode details = objectMapper.readTree(detailsJson == null ? "" : detailsJson);
            JsonNode catalog = findCatalogProduct(catalogRoot, expectedProductId);
            if (catalog == null) {
                throw new ProductImportException(
                        "WILDBERRIES_PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND,
                        "Wildberries product was not found."
                );
            }
            if (details == null || details.path("nm_id").asLong(-1) != expectedProductId) {
                throw invalid("Wildberries product data did not match the requested product.");
            }

            List<String> warnings = new ArrayList<>();
            List<KaspiCharacteristic> characteristics = new ArrayList<>();
            String title = first(text(details, "imt_name"), text(catalog, "name"));
            String brand = first(text(catalog, "brand"), text(details.path("selling"), "brand_name"));
            String sourceCategory = first(text(details, "subj_name"), text(catalog, "subjectName"));

            LinkedHashSet<String> exactModels = new LinkedHashSet<>();
            JsonNode options = details.path("options");
            if (options.isArray()) {
                for (JsonNode option : options) {
                    String label = first(text(option, "name"), text(option, "charcName"));
                    String value = first(text(option, "value"), text(option, "charcValue"));
                    if (label == null || value == null) continue;
                    characteristics.add(new KaspiCharacteristic(label, value));
                    if (MODEL_LABELS.contains(normalizeLabel(label))) {
                        exactModels.add(value);
                    }
                }
            }

            addMetadata(characteristics, "Артикул Wildberries", String.valueOf(expectedProductId));
            addMetadata(characteristics, "Артикул продавца", text(details, "vendor_code"));
            addMetadata(characteristics, "Категория Wildberries", sourceCategory);
            Integer originalPrice = parsePrice(catalog, "basic", warnings, false);
            if (originalPrice != null) addMetadata(characteristics, "Старая цена Wildberries", originalPrice + " KZT");

            ModelCandidate modelCandidate = singleModelCandidate(exactModels);
            if (modelCandidate.ambiguous()) warnings.add("MODEL_AMBIGUOUS");
            if (modelCandidate.value() == null && !modelCandidate.ambiguous()) {
                modelCandidate = modelFromTitle(title);
                if (modelCandidate.ambiguous()) warnings.add("MODEL_AMBIGUOUS");
                else if (modelCandidate.value() != null) warnings.add("MODEL_FROM_TITLE");
            }
            String model = modelCandidate.value();

            Integer price = parsePrice(catalog, "product", warnings, true);
            if (title == null) warnings.add("NAME_NOT_FOUND");
            if (characteristics.isEmpty()) warnings.add("CHARACTERISTICS_NOT_FOUND");

            return new WildberriesParsedProduct(
                    new KaspiParsedProduct(
                            clean(title, 1_000), clean(brand, 200), model, price,
                            null, List.copyOf(characteristics), List.copyOf(warnings)
                    ),
                    clean(sourceCategory, 200)
            );
        } catch (ProductImportException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ProductImportException(
                    "WILDBERRIES_RESPONSE_INVALID", HttpStatus.BAD_GATEWAY,
                    "Wildberries returned invalid product data.", ex
            );
        }
    }

    private JsonNode findCatalogProduct(JsonNode root, long expectedProductId) {
        JsonNode products = root == null ? null : root.path("products");
        if (products == null || !products.isArray()) return null;
        for (JsonNode product : products) {
            if (product.path("id").asLong(-1) == expectedProductId) return product;
        }
        return null;
    }

    private Integer parsePrice(JsonNode catalog, String priceField, List<String> warnings, boolean required) {
        LinkedHashSet<Integer> prices = new LinkedHashSet<>();
        JsonNode sizes = catalog.path("sizes");
        if (sizes.isArray()) {
            for (JsonNode size : sizes) {
                JsonNode price = size.path("price");
                JsonNode raw = price.path(priceField);
                if (!raw.isIntegralNumber()) continue;
                long minor = raw.asLong(-1);
                long logistics = "product".equals(priceField) && price.path("logistics").isIntegralNumber()
                        ? price.path("logistics").asLong(0) : 0;
                if (minor < 0 || logistics < 0 || minor > Long.MAX_VALUE - logistics) continue;
                long total = minor + logistics;
                if (total % 100 != 0 || total / 100 > Integer.MAX_VALUE) continue;
                prices.add((int) (total / 100));
            }
        }
        if (prices.size() == 1) return prices.iterator().next();
        if (required) warnings.add(prices.isEmpty() ? "PRICE_NOT_FOUND" : "PRICE_AMBIGUOUS");
        return null;
    }

    private ModelCandidate modelFromTitle(String title) {
        if (title == null) return ModelCandidate.empty();
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        Matcher matcher = TITLE_TOKEN.matcher(title);
        String previousToken = null;
        while (matcher.find()) {
            String candidate = matcher.group(1);
            if (containsLetter(candidate) && containsDigit(candidate)) {
                String prefix = previousToken != null && previousToken.matches("\\p{Lu}{2,4}")
                        ? previousToken + " " : "";
                candidates.add(prefix + candidate);
            }
            previousToken = candidate;
        }
        return singleModelCandidate(candidates);
    }

    private ModelCandidate singleModelCandidate(Set<String> candidates) {
        if (candidates.size() == 1) return new ModelCandidate(candidates.iterator().next(), false);
        return new ModelCandidate(null, candidates.size() > 1);
    }

    private boolean containsLetter(String value) {
        return value.codePoints().anyMatch(Character::isLetter);
    }

    private boolean containsDigit(String value) {
        return value.codePoints().anyMatch(Character::isDigit);
    }

    private String text(JsonNode node, String key) {
        if (node == null) return null;
        JsonNode value = node.get(key);
        return value != null && value.isTextual() ? clean(value.asText(), 20_000) : null;
    }

    private void addMetadata(List<KaspiCharacteristic> characteristics, String label, String value) {
        if (value != null) characteristics.add(new KaspiCharacteristic(label, value));
    }

    private String first(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return null;
    }

    private String clean(String value, int maximumLength) {
        if (value == null) return null;
        String clean = value.replace('\u0000', ' ').replaceAll("[\\p{Cc}&&[^\\r\\n\\t]]", " ")
                .replaceAll("[ \\t]+", " ").trim();
        if (clean.isBlank()) return null;
        return clean.length() <= maximumLength ? clean : clean.substring(0, maximumLength).trim();
    }

    private String normalizeLabel(String value) {
        return value == null ? "" : value.trim().toLowerCase(java.util.Locale.ROOT).replace('ё', 'е');
    }

    private ProductImportException invalid(String message) {
        return new ProductImportException("WILDBERRIES_RESPONSE_INVALID", HttpStatus.BAD_GATEWAY, message);
    }

    private record ModelCandidate(String value, boolean ambiguous) {
        private static ModelCandidate empty() {
            return new ModelCandidate(null, false);
        }
    }
}
