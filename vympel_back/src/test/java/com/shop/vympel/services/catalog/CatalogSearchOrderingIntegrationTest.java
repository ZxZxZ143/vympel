package com.shop.vympel.services.catalog;

import com.shop.vympel.controllers.ProductPublicController;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.enums.Language;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@Transactional
class CatalogSearchOrderingIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired ProductPublicController controller;
    @Autowired ProductCatalogService catalog;
    @Autowired PublicProductQueryService queryService;
    @Autowired EntityManagerFactory entityManagerFactory;
    String phrase;
    Long exact;
    Long brand;
    final List<Long> eligible = new ArrayList<>();

    @BeforeEach void fixtures() {
        phrase = "RankProof " + UUID.randomUUID().toString().substring(0, 8);
        brand = jdbc.queryForObject("SELECT id FROM brand WHERE code='romanson'", Long.class);
        for (int i = 0; i < 23; i++) eligible.add(product(phrase + " edition " + i, "partial-" + i, 100 + i, 5, "ACTIVE"));
        exact = product(phrase.toUpperCase(Locale.ROOT), "exact", 999999, 0, "ACTIVE");
        eligible.add(exact);
        product(phrase, "draft", 1, 5, "DRAFT");
        Long otherBrand = product(phrase, "other-brand", 1, 5, "ACTIVE");
        jdbc.update("UPDATE product SET brand_id=(SELECT id FROM brand WHERE code='adriatica') WHERE id=?", otherBrand);
        Long otherCategory = product(phrase, "other-category", 1, 5, "ACTIVE");
        jdbc.update("DELETE FROM product_category WHERE product_id=?", otherCategory);
        jdbc.update("INSERT INTO product_category(product_id,category_id) SELECT ?,id FROM category WHERE code='ACCESSORY'", otherCategory);
        // Multiple translations must not duplicate rows in the ID query or count.
        jdbc.update("INSERT INTO product_i18n(product_id,lang,name) VALUES (?, 'en', ?), (?, 'kk', ?)", exact, phrase, exact, phrase);
    }

    private Long product(String name, String model, int price, int stock, String status) {
        Long id = jdbc.queryForObject("""
            INSERT INTO product(model,sku,price,stock_quantity,status,product_type,brand_id,created_at)
            VALUES (?, ?, ?, ?, ?, 'WATCH', ?, now()) RETURNING id
            """, Long.class, model, UUID.randomUUID().toString(), price, stock, status, brand);
        jdbc.update("UPDATE product SET created_at=timestamp '2026-01-01' + id * interval '1 second' WHERE id=?", id);
        jdbc.update("INSERT INTO product_i18n(product_id,lang,name) VALUES (?, 'ru', ?)", id, name);
        jdbc.update("INSERT INTO product_category(product_id,category_id) SELECT ?,id FROM category WHERE code='WATCH_WRIST'", id);
        return id;
    }

    private Page<ProductShortResponse> page(int number, String sort, Language language) {
        var params = new LinkedMultiValueMap<String, String>();
        params.add("search", phrase);
        params.add("brand", brand.toString());
        params.add("categoryCode", "WATCH_WRIST");
        if (sort != null) params.add("sort", sort);
        return controller.getCatalogProducts(language, params,
                PageRequest.of(number, 9, sort == null ? Sort.unsorted() : Sort.by(sort))).getBody();
    }
    private List<Long> ids(Page<ProductShortResponse> page) {
        return page.getContent().stream().map(ProductShortResponse::getId).toList();
    }

    @Test void exactExpensiveUnavailableNameWinsBeforeOffsetLimitAcrossLocales() {
        for (Language lang : List.of(Language.RU, Language.EN, Language.KZ)) {
            var first = page(0, null, lang);
            assertThat(first.getTotalElements()).isEqualTo(24);
            assertThat(first.getTotalPages()).isEqualTo(3);
            assertThat(ids(first).get(0)).isEqualTo(exact);
            assertThat(first.getContent().get(0).getStockQuantity()).isZero();
        }
        assertThat(ids(page(0, "priceAsc", Language.RU))).doesNotContain(exact);
        assertThat(ids(page(2, "priceAsc", Language.RU))).contains(exact);
    }

    @Test void globalOrderIsStableNonOverlappingAndKeepsExactlyTheMatchedSet() {
        List<Long> ranked = new ArrayList<>();
        List<Long> priced = new ArrayList<>();
        for (int n = 0; n < 3; n++) {
            var ids = ids(page(n, null, Language.RU));
            assertThat(ids(page(n, null, Language.RU))).isEqualTo(ids);
            ranked.addAll(ids);
            priced.addAll(ids(page(n, "priceAsc", Language.RU)));
        }
        assertThat(ranked).doesNotHaveDuplicates().containsExactlyInAnyOrderElementsOf(eligible);
        assertThat(priced).containsExactlyInAnyOrderElementsOf(ranked);
        assertThat(page(3, null, Language.RU).getContent()).isEmpty();
        assertThat(page(3, null, Language.RU).getTotalElements()).isEqualTo(24);
    }

    @Test void explicitPriceAndDateOrdersOverrideRelevanceWithExistingAvailabilityPolicy() {
        for (String sort : List.of("priceAsc", "priceDesc", "newest", "oldest")) {
            var first = page(0, sort, Language.RU);
            assertThat(ids(first)).doesNotContain(exact);
            assertThat(first.getTotalElements()).isEqualTo(24);
        }
        var asc = page(0, "priceAsc", Language.RU).getContent().stream().map(ProductShortResponse::getPrice).toList();
        assertThat(asc).isSorted();
        var desc = page(0, "priceDesc", Language.RU).getContent().stream().map(ProductShortResponse::getPrice).toList();
        assertThat(desc).isSortedAccordingTo(Comparator.reverseOrder());
        assertThat(ids(page(0, "newest", Language.RU)).get(0)).isEqualTo(eligible.get(22));
        assertThat(ids(page(0, "oldest", Language.RU)).get(0)).isEqualTo(eligible.get(0));
    }

    @Test void exactModelAndSkuRankAbovePartialNamesWithoutChangingEligibility() {
        Long model = product("Other title", phrase, 800000, 1, "ACTIVE");
        Long sku = product("Other title", "sku-only", 900000, 1, "ACTIVE");
        jdbc.update("UPDATE product SET sku=? WHERE id=?", phrase, sku);
        var ids = ids(page(0, null, Language.RU));
        assertThat(ids.get(0)).isEqualTo(exact);
        assertThat(ids.subList(1, 3)).containsExactlyInAnyOrder(model, sku);
        assertThat(page(0, null, Language.RU).getTotalElements()).isEqualTo(26);
    }

    @Test void rankOnlyNormalizationHandlesCaseWhitespaceAndLiteralWildcards() {
        phrase = "Literal_50% test";
        exact = product("  LITERAL_50%   TEST  ", "normalization", 999999, 0, "ACTIVE");
        product("LiteralX50YY test", "wildcard-partial", 1, 10, "ACTIVE");
        assertThat(ids(page(0, null, Language.RU)).get(0)).isEqualTo(exact);
        assertThat(page(0, null, Language.RU).getTotalElements())
                .isEqualTo(page(0, "priceAsc", Language.RU).getTotalElements());
    }

    @Test void quickSearchStaysUnchangedAndQueryCountDoesNotGrowPerCard() {
        var before = catalog.quickSearch(phrase, 8, Language.RU).stream().map(item -> item.getId()).toList();
        var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        queryService.findIds((root, query, cb) -> root.get("id").in(eligible), PageRequest.of(0, 9), phrase);
        long firstQueries = statistics.getPrepareStatementCount();
        statistics.clear();
        queryService.findIds((root, query, cb) -> root.get("id").in(eligible), PageRequest.of(1, 15), phrase);
        assertThat(statistics.getPrepareStatementCount()).isEqualTo(firstQueries);
        assertThat(firstQueries).isEqualTo(2);
        assertThat(catalog.quickSearch(phrase, 8, Language.RU).stream().map(item -> item.getId()).toList()).isEqualTo(before);
    }
}
