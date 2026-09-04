package com.shop.vympel.services.product;

import com.shop.vympel.enums.Language;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class ProductModelVariantIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vympel_product_variants")
            .withUsername("vympel")
            .withPassword("product-variant-test-password");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ProductModelVariantService variantService;

    @Test
    @Transactional
    void groupsByBrandNormalizedModelAndCategoryProfileWithPublicVisibilityRules() {
        Long romansonId = id("select id from brand where lower(code) = 'romanson'");
        Long otherBrandId = id("select id from brand where id <> ? order by id limit 1", romansonId);
        Long watchCategoryId = id("select id from category where code = 'WATCH_WRIST'");
        Long accessoryCategoryId = id("select id from category where code = 'ACCESSORIES'");

        Long currentId = addProduct(" Variant-Model ", "ACTIVE", romansonId, watchCategoryId, "current");
        Long siblingId = addProduct("variant-model", "ACTIVE", romansonId, watchCategoryId, "sibling");
        Long noImageId = addProduct("VARIANT-MODEL", "ACTIVE", romansonId, watchCategoryId, "no-image");
        Long draftId = addProduct("VARIANT-MODEL", "DRAFT", romansonId, watchCategoryId, "draft");
        Long archivedId = addProduct("VARIANT-MODEL", "ARCHIVED", romansonId, watchCategoryId, "archived");
        Long otherBrand = addProduct("VARIANT-MODEL", "ACTIVE", otherBrandId, watchCategoryId, "other-brand");
        Long otherProfile = addProduct("VARIANT-MODEL", "ACTIVE", romansonId, accessoryCategoryId, "accessory");
        Long otherModel = addProduct("VARIANT-MODEL-R", "ACTIVE", romansonId, watchCategoryId, "other-model");

        Long inactiveCategoryId = jdbcTemplate.queryForObject(
                "insert into category(code, parent_id, active) values (?, ?, false) returning id",
                Long.class,
                "WATCH_VARIANT_TEST_INACTIVE",
                watchCategoryId
        );
        Long hiddenId = addProduct("VARIANT-MODEL", "ACTIVE", romansonId, inactiveCategoryId, "hidden");

        jdbcTemplate.update(
                "insert into media(url, type, position, is_main, product_id) values (?, 'IMAGE', 0, true, ?)",
                "products/current.jpg",
                currentId
        );
        jdbcTemplate.update(
                "insert into media(url, type, position, is_main, product_id) values (?, 'IMAGE', 5, false, ?)",
                "products/sibling-fallback.jpg",
                siblingId
        );

        var publicGroup = variantService.getPublicGroup(currentId, Language.RU);
        List<Long> expectedPublicOrder = List.of(currentId, siblingId, noImageId);
        assertThat(publicGroup.total()).isEqualTo(3);
        assertThat(publicGroup.variants()).extracting(variant -> variant.id())
                .containsExactlyElementsOf(expectedPublicOrder);
        assertThat(publicGroup.variants().get(1).mainImage()).isNotNull();
        assertThat(publicGroup.variants().get(1).mainImage().isMain()).isFalse();
        assertThat(publicGroup.variants().get(2).mainImage()).isNull();

        var crmGroup = variantService.getCrmGroup(currentId, Language.RU);
        List<Long> expectedCrmOrder = List.of(currentId, siblingId, noImageId, draftId, archivedId, hiddenId);
        assertThat(crmGroup.total()).isEqualTo(6);
        assertThat(crmGroup.variants()).extracting(variant -> variant.id())
                .containsExactlyElementsOf(expectedCrmOrder);
        assertThat(crmGroup.variants()).extracting(variant -> variant.id())
                .doesNotContain(otherBrand, otherProfile, otherModel);

        for (Long anchorId : expectedPublicOrder) {
            assertThat(variantService.getPublicGroup(anchorId, Language.RU).variants())
                    .extracting(variant -> variant.id())
                    .as("public variant order for anchor %s", anchorId)
                    .containsExactlyElementsOf(expectedPublicOrder);
        }
        for (Long anchorId : expectedCrmOrder) {
            assertThat(variantService.getCrmGroup(anchorId, Language.RU).variants())
                    .extracting(variant -> variant.id())
                    .as("CRM variant order for anchor %s", anchorId)
                    .containsExactlyElementsOf(expectedCrmOrder);
        }

        jdbcTemplate.update("update product set model = 'CHANGED-MODEL' where id = ?", siblingId);
        assertThat(variantService.getPublicGroup(currentId, Language.RU).variants())
                .extracting(variant -> variant.id())
                .containsExactly(currentId, noImageId);
    }

    @Test
    void migrationAddsTheDerivedGroupingIndexWithoutPersistentVariantState() {
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from pg_indexes where indexname = 'idx_product_brand_normalized_model'",
                Integer.class
        )).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from information_schema.tables where table_name = 'product_variant_group'",
                Integer.class
        )).isZero();
    }

    private Long addProduct(
            String model,
            String status,
            Long brandId,
            Long categoryId,
            String suffix
    ) {
        Long productId = jdbcTemplate.queryForObject(
                """
                insert into product(
                    model, sku, price, stock_quantity, status, product_type, brand_id, created_at, updated_at
                ) values (?, ?, 100000, 1, ?, 'WATCH', ?, now(), now())
                returning id
                """,
                Long.class,
                model,
                "VARIANT-TEST-" + suffix,
                status,
                brandId
        );
        jdbcTemplate.update(
                "insert into product_category(product_id, category_id) values (?, ?)",
                productId,
                categoryId
        );
        jdbcTemplate.update(
                "insert into product_i18n(product_id, lang, name) values (?, 'ru', ?)",
                productId,
                "Variant " + suffix
        );
        return productId;
    }

    private Long id(String sql, Object... args) {
        return jdbcTemplate.queryForObject(sql, Long.class, args);
    }
}
