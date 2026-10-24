package com.shop.vympel.services.catalog;

import com.shop.vympel.controllers.ProductPublicController;
import com.shop.vympel.dtos.catalog.*;
import com.shop.vympel.enums.Language;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;

import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class CatalogFacetIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired ProductCatalogService catalog;
    @Autowired ProductPublicController controller;
    String categoryCode;
    Long category, quartz, mechanical, ceramic, steel, brand, otherBrand, stone;

    @BeforeEach void fixtures() {
        categoryCode = "FACET_" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
        category = jdbc.queryForObject("INSERT INTO category(code,parent_id,active) SELECT ?,id,true FROM category WHERE code='WATCH_WRIST' RETURNING id", Long.class, categoryCode);
        quartz = id("watch_mechanism", "code='QUARTZ'");
        mechanical = id("watch_mechanism", "code<>'QUARTZ'");
        ceramic = id("material", "code='CERAMIC'");
        steel = id("material", "code<>'CERAMIC'");
        brand = id("brand", "code='romanson'");
        otherBrand = id("brand", "code='adriatica'");
        stone = id("stone_inlay", "code='SWAROVSKI'");
        product(quartz, ceramic, brand, 100, "ACTIVE", "Ceramic Quartz");
        product(quartz, ceramic, brand, 200, "ACTIVE", "Ceramic Quartz");
        product(mechanical, ceramic, otherBrand, 300, "ACTIVE", "Ceramic Mechanical");
        product(quartz, steel, brand, 400, "ACTIVE", "Steel Quartz");
        product(quartz, ceramic, brand, 50, "DRAFT", "Draft Ceramic");
    }

    private Long id(String table, String condition) {
        return jdbc.queryForObject("SELECT id FROM " + table + " WHERE " + condition + " ORDER BY id LIMIT 1", Long.class);
    }
    private Long product(Long mechanism, Long material, Long brandId, int price, String status, String name) {
        Long product = jdbc.queryForObject("INSERT INTO product(model,sku,price,stock_quantity,status,product_type,brand_id,created_at) VALUES (?,?,?,5,?,'WATCH',?,now()) RETURNING id",
                Long.class, name, UUID.randomUUID().toString(), price, status, brandId);
        jdbc.update("INSERT INTO product_i18n(product_id,lang,name) VALUES (?,'ru',?)", product, name);
        jdbc.update("INSERT INTO product_category(product_id,category_id) VALUES (?,?)", product, category);
        jdbc.update("INSERT INTO watch_details(product_id,mechanism_id,case_material_id,case_size_mm) VALUES (?,?,?,40)", product, mechanism, material);
        return product;
    }
    private CatalogFiltersResponse facets(Map<String,List<String>> filters) {
        return catalog.getFilters(new CatalogProductQuery(categoryCode, null, null, null, filters), Language.RU);
    }
    private CatalogFilterResponse facet(CatalogFiltersResponse response, String key) {
        return response.getFilters().stream().filter(f -> f.getKey().equals(key)).findFirst().orElseThrow();
    }
    private long count(CatalogFiltersResponse response, String key, Long value) {
        return facet(response,key).getOptions().stream().filter(o -> o.getValue().equals(value.toString())).findFirst().orElseThrow().getCount();
    }

    @Test void countsIntersectOtherFiltersButKeepAlternativesWithinTheSameFacet() {
        assertThat(count(facets(Map.of()), "mechanism", quartz)).isEqualTo(3);
        var selected = Map.of("caseMaterial", List.of(ceramic.toString()));
        var ceramicOnly = facets(selected);
        assertThat(count(ceramicOnly, "mechanism", quartz)).isEqualTo(2);
        assertThat(count(ceramicOnly, "mechanism", mechanical)).isEqualTo(1);
        var combined = facets(Map.of("caseMaterial", List.of(ceramic.toString()), "mechanism", List.of(quartz.toString())));
        assertThat(count(combined,"mechanism",mechanical)).isEqualTo(1);
        assertThat(count(combined,"caseMaterial",steel)).isEqualTo(1);
        assertThat(count(combined,"brand",otherBrand)).isZero();
        assertThat(facet(combined,"brand").getOptions().stream().filter(o -> o.getValue().equals(otherBrand.toString())).findFirst().orElseThrow().isDisabled()).isTrue();
    }

    @Test void multiSelectUnionsWithinFacetAndResetRestoresCounts() {
        var response = facets(Map.of("caseMaterial",List.of(ceramic + "," + steel),"mechanism",List.of(quartz.toString(),mechanical.toString())));
        assertThat(count(response,"brand",brand)).isEqualTo(3);
        assertThat(count(response,"mechanism",quartz)).isEqualTo(3);
        assertThat(count(facets(Map.of()),"mechanism",quartz)).isEqualTo(3);
    }

    @Test void endpointUsesSearchPriceAliasesAndRepeatedFiltersWithTheSameProductMatching() {
        var params = new LinkedMultiValueMap<String,String>();
        params.add("categoryCode",categoryCode);
        params.add("caseMaterial",ceramic.toString());
        params.add("search","Quartz");
        params.add("minPrice","150");
        params.add("maxPrice","250");
        var response = controller.getCatalogFilters(Language.RU,params).getBody();
        assertThat(count(response,"mechanism",quartz)).isEqualTo(1);
        assertThat(count(response,"mechanism",mechanical)).isZero();
        assertThat(controller.getCatalogProducts(Language.RU,params,PageRequest.of(0,9)).getBody().getTotalElements()).isEqualTo(1);
        // Price bounds ignore the current price selection, while honoring search/material.
        assertThat(facet(response,"price").getMin()).isEqualByComparingTo(new BigDecimal("100"));
        assertThat(facet(response,"price").getMax()).isEqualByComparingTo(new BigDecimal("200"));
    }

    @Test void stoneDictionaryValuesRemainVisibleAlongsideActualOptions() {
        var fallback = facet(facets(Map.of()),"stoneInlay");
        assertThat(fallback.getOptions()).isNotEmpty().allMatch(o -> o.isDisabled() && o.getCount()==0);
        Long actual = jdbc.queryForObject("INSERT INTO stone_inlay(code,active) VALUES (?,true) RETURNING id",Long.class,"ACTUAL_"+UUID.randomUUID());
        Long product = product(quartz,ceramic,brand,100,"ACTIVE","Stone watch");
        jdbc.update("UPDATE watch_details SET stone_inlay_id=? WHERE product_id=?",actual,product);
        var populated = facets(Map.of());
        assertThat(facet(populated,"stoneInlay").getOptions()).extracting(CatalogFilterOptionResponse::getValue).contains(stone.toString(), actual.toString());
        assertThat(count(populated,"stoneInlay",stone)).isZero();
        assertThat(count(populated,"stoneInlay",actual)).isEqualTo(1);
    }

    @Test void zeroMatchesKeepKnownOptionsWithTruthfulZeroCountsAndNoDraftLeak() {
        var response = catalog.getFilters(new CatalogProductQuery(categoryCode,null,new BigDecimal("9999"),null,Map.of()),Language.EN);
        assertThat(facet(response,"mechanism").getOptions()).hasSize(jdbc.queryForObject("SELECT count(*) FROM watch_mechanism WHERE active=true",Integer.class)).allMatch(o -> o.getCount()==0 && o.isDisabled());
        assertThat(count(facets(Map.of()),"mechanism",quartz)).isEqualTo(3);
    }

    @Test void categoryScopeAndLocalesDoNotChangeCountsOrDuplicateProducts() {
        for (Language language : List.of(Language.RU,Language.EN,Language.KZ)) {
            var response = catalog.getFilters(new CatalogProductQuery(categoryCode,null,null,null,Map.of("caseMaterial",List.of(ceramic.toString()))),language);
            assertThat(count(response,"mechanism",quartz)).isEqualTo(2);
        }
        jdbc.update("UPDATE category SET active=false WHERE id=?",category);
        // Inactive categories are excluded by the public category resolver.
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> facets(Map.of())).isInstanceOf(com.shop.vympel.exceptions.ResourceNotFoundException.class);
    }

    @Test void genderAndOtherDictionariesStayVisibleWithoutAssignedProducts() {
        var response = facets(Map.of());
        for (String key : List.of("gender", "strapMaterial", "glassType", "stoneInlay")) {
            assertThat(facet(response,key).getOptions()).as(key).isNotEmpty().allMatch(o -> o.getCount()==0 && o.isDisabled());
        }
        Long men = id("gender", "code='MEN'");
        Long women = id("gender", "code='WOMEN'");
        Long product = product(quartz,ceramic,brand,100,"ACTIVE","Gender fixture");
        jdbc.update("UPDATE watch_details SET gender_id=? WHERE product_id=?",men,product);
        var populated = facets(Map.of("caseMaterial",List.of(ceramic.toString())));
        assertThat(count(populated,"gender",men)).isEqualTo(1);
        assertThat(count(populated,"gender",women)).isZero();
        assertThat(facet(populated,"gender").getOptions().stream().filter(o -> o.getValue().equals(women.toString())).findFirst().orElseThrow().isDisabled()).isTrue();
    }

    @Test void emptyCategoryKeepsAllDictionaryValuesAndSeparatesMaterialRoles() {
        jdbc.update("DELETE FROM product_category WHERE category_id=?",category);
        var response = facets(Map.of());
        for (String key : List.of("mechanism","gender","caseMaterial","strapMaterial","glassType","stoneInlay")) {
            assertThat(facet(response,key).getOptions()).as(key).isNotEmpty().allMatch(o -> o.getCount()==0 && o.isDisabled());
        }
        Long leather = id("material", "code='LEATHER'");
        assertThat(facet(response,"strapMaterial").getOptions()).extracting(CatalogFilterOptionResponse::getValue).contains(leather.toString()).doesNotContain(ceramic.toString());
        assertThat(facet(response,"caseMaterial").getOptions()).extracting(CatalogFilterOptionResponse::getValue).contains(ceramic.toString()).doesNotContain(leather.toString());
    }

    @Test void interiorFacetQueryAcceptsItsOwnProfileSelections() {
        String interiorCode = categoryCode + "_INTERIOR";
        jdbc.update("INSERT INTO category(code,parent_id,active) SELECT ?,id,true FROM category WHERE code='WATCH_INTERIOR'",interiorCode);
        var response = catalog.getFilters(new CatalogProductQuery(interiorCode,null,null,null,
                Map.of("interiorCaseMaterial",List.of(ceramic.toString()))),Language.RU);
        assertThat(response.getFilters()).extracting(CatalogFilterResponse::getKey)
                .contains("interiorCaseMaterial","interiorMechanismType","powerType").doesNotContain("stoneInlay");
        for (String key : List.of("interiorCaseMaterial","interiorColor","interiorStyle","interiorMechanismType","powerType")) {
            assertThat(facet(response,key).getOptions()).as(key).isNotEmpty().allMatch(o -> o.getCount()==0 && o.isDisabled());
        }
    }
}
