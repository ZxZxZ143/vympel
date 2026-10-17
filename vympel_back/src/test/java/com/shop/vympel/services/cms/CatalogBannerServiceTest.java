package com.shop.vympel.services.cms;

import com.shop.vympel.dtos.cms.CmsCategoryBannerResponse;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class CatalogBannerServiceTest {
    private final List<CatalogBannerService.CategoryNode> tree = List.of(
        node(1L, "ROOT", null), node(2L, "CHILD", 1L), node(3L, "GRANDCHILD", 2L), node(4L, "SIBLING", 1L));
    private CatalogBannerService.CategoryNode node(Long id, String code, Long parent) {
        return new CatalogBannerService.CategoryNode(id, code, parent, true, Map.of("en", code));
    }
    private CmsCategoryBannerResponse resolve(String code, Set<String> keys) {
        return CatalogBannerService.resolve(tree, keys, keys, false).stream().filter(row -> row.categoryCode().equals(code)).findFirst().orElseThrow();
    }
    private String key(String code) { return "catalog.category." + code + ".heroBanner"; }
    @Test void inheritsNearestAncestorAndPreservesOwnOverrides() {
        assertThat(resolve("CHILD", Set.of(key("ROOT"))).sourceCategoryCode()).isEqualTo("ROOT");
        assertThat(resolve("GRANDCHILD", Set.of(key("ROOT"), key("CHILD"))).sourceCategoryCode()).isEqualTo("CHILD");
        assertThat(resolve("CHILD", Set.of(key("ROOT"), key("CHILD"))).mode()).isEqualTo("OWN");
        assertThat(resolve("ROOT", Set.of(key("CHILD"))).mode()).isEqualTo("DEFAULT");
    }
    @Test void removingOverrideRestoresInheritanceAndDoesNotChangeOtherBranches() {
        var withOverride = Set.of(key("ROOT"), key("CHILD"));
        assertThat(resolve("SIBLING", withOverride).effectiveBlockKey()).isEqualTo(key("ROOT"));
        assertThat(resolve("CHILD", withOverride).effectiveBlockKey()).isEqualTo(key("CHILD"));
        assertThat(resolve("CHILD", Set.of(key("ROOT"))).effectiveBlockKey()).isEqualTo(key("ROOT"));
        assertThat(resolve("GRANDCHILD", Set.of(key("ROOT"))).sourceCategoryCode()).isEqualTo("ROOT");
    }
    @Test void defaultsToGenericThenStaticAndDoesNotPublishDraftAssignments() {
        assertThat(resolve("GRANDCHILD", Set.of("catalog.heroBanner")).effectiveBlockKey()).isEqualTo("catalog.heroBanner");
        assertThat(resolve("GRANDCHILD", Set.of()).effectiveBlockKey()).isNull();
        var rows = CatalogBannerService.resolve(tree, Set.of(key("CHILD")), Set.of(key("ROOT")), true);
        var child = rows.stream().filter(row -> row.categoryCode().equals("CHILD")).findFirst().orElseThrow();
        assertThat(child.explicitBlockKey()).isEqualTo(key("CHILD"));
        assertThat(child.sourceCategoryCode()).isEqualTo("ROOT");
    }
    @Test void omitsInactiveAndCyclicPublicPaths() {
        var invalid = List.of(new CatalogBannerService.CategoryNode(1L,"OFF",null,false,Map.of()),node(2L,"CHILD",1L),node(3L,"CYCLE",3L));
        assertThat(CatalogBannerService.resolve(invalid, Set.of(), Set.of(), false)).isEmpty();
    }
}
