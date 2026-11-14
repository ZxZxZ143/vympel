package com.shop.vympel.services.accessoryDetail;

import com.shop.vympel.enums.Language;
import com.shop.vympel.services.product.ProductService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression for the public product page of accessories: lazy material/color associations
 * must resolve without an ambient transaction (open-in-view is disabled), as in production.
 * The test method is intentionally not {@code @Transactional}.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class AccessoryDetailPublicReadIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vympel_accessory_public_read")
            .withUsername("vympel")
            .withPassword("accessory-public-read-test-password");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ProductService productService;

    private Long productId;

    @AfterEach
    void cleanUp() {
        if (productId != null) {
            jdbcTemplate.update("delete from product where id = ?", productId);
        }
    }

    @Test
    void publicAccessoryWithMaterialsAndColorLoadsOutsideATransaction() {
        Long brandId = id("select id from brand order by id limit 1");
        Long accessoryCategoryId = id("select id from category where code = 'ACCESSORIES'");
        Long materialId = id("select id from material order by id limit 1");
        Long colorId = id("select id from interior_feature where feature_type = 'COLOR' and active order by id limit 1");

        productId = jdbcTemplate.queryForObject(
                """
                insert into product(
                    model, sku, price, stock_quantity, status, product_type, brand_id, created_at, updated_at
                ) values ('ACC-LAZY', 'ACC-LAZY-TEST', 15000, 1, 'ACTIVE', 'ACCESSORY', ?, now(), now())
                returning id
                """,
                Long.class,
                brandId
        );
        jdbcTemplate.update("insert into product_category(product_id, category_id) values (?, ?)",
                productId, accessoryCategoryId);
        jdbcTemplate.update("insert into product_i18n(product_id, lang, name) values (?, 'ru', 'Браслет')", productId);
        Long descriptionId = jdbcTemplate.queryForObject(
                "insert into product_description(product_id) values (?) returning id", Long.class, productId);
        jdbcTemplate.update(
                "insert into product_description_i18n(description_id, lang, content_md) values (?, 'ru', 'Описание')",
                descriptionId);
        jdbcTemplate.update(
                """
                insert into accessory_details(product_id, clasp_type, case_material_id, insert_material_id, has_insert, color_id, length)
                values (?, 'Карабин', ?, ?, true, ?, '21 см')
                """,
                productId, materialId, materialId, colorId
        );

        var accessoryDetails = productService.getPublic(productId, Language.RU).accessoryDetails();

        assertThat(accessoryDetails).isNotNull();
        assertThat(accessoryDetails.caseMaterial().getId()).isEqualTo(materialId);
        assertThat(accessoryDetails.caseMaterial().getName()).isNotBlank();
        assertThat(accessoryDetails.insertMaterial().getId()).isEqualTo(materialId);
        assertThat(accessoryDetails.color().getId()).isEqualTo(colorId);
        assertThat(accessoryDetails.length()).isEqualTo("21 см");
    }

    private Long id(String sql) {
        return jdbcTemplate.queryForObject(sql, Long.class);
    }
}
