package com.shop.vympel.db;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "STEP7_REHEARSAL_JDBC_URL", matches = ".+")
class Step7ExternalDatabaseRehearsalTest {
    @DynamicPropertySource
    static void rehearsalDatabaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("STEP7_REHEARSAL_JDBC_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("STEP7_REHEARSAL_DB_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("STEP7_REHEARSAL_DB_PASSWORD"));
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void restoredLiveDataMigratesAndRejectsInvalidWrites() {
        assertThat(jdbcTemplate.queryForObject(
                """
                select count(*) from databasechangelog
                where id in (
                    '2026-07-17-03-step7-data-normalization',
                    '2026-07-17-04-step7-database-integrity'
                )
                """,
                Integer.class
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                """
                select count(*) from pg_constraint
                where conname in (
                    'chk_product_price_nonnegative',
                    'chk_product_stock_nonnegative',
                    'chk_media_position_nonnegative',
                    'uk_media_product_type_position',
                    'chk_media_main_image_position',
                    'chk_cms_block_sort_order_nonnegative',
                    'uk_cms_block_page_sort_order'
                )
                """,
                Integer.class
        )).isEqualTo(7);
        assertThat(jdbcTemplate.queryForList(
                """
                select b.sort_order
                from cms_block b
                join cms_page p on p.id = b.page_id
                where p.page_key = 'about'
                  and b.block_key in ('about.heroBanner', 'about.intro', 'about.cooperationBanner')
                order by b.sort_order
                """,
                Integer.class
        )).containsExactly(10, 20, 30);
        assertThat(jdbcTemplate.queryForObject(
                """
                select count(*)
                from product p
                where p.status = 'ACTIVE'
                  and not exists (
                      select 1 from media m
                      where m.product_id = p.id
                        and m.type = 'IMAGE'
                        and m.is_main = true
                        and m.position = 0
                  )
                """,
                Long.class
        )).isZero();

        Long productId = jdbcTemplate.queryForObject("select min(id) from product", Long.class);
        Long cmsTargetId = jdbcTemplate.queryForObject(
                """
                select b.id
                from cms_block b
                join cms_page p on p.id = b.page_id
                where p.page_key = 'about'
                order by b.sort_order desc
                limit 1
                """,
                Long.class
        );
        Integer duplicateSortOrder = jdbcTemplate.queryForObject(
                """
                select min(b.sort_order)
                from cms_block b
                join cms_page p on p.id = b.page_id
                where p.page_key = 'about'
                """,
                Integer.class
        );

        assertThatThrownBy(() -> jdbcTemplate.update("update product set price = -1 where id = ?", productId))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update("update product set stock_quantity = -1 where id = ?", productId))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "update cms_block set sort_order = ? where id = ?",
                duplicateSortOrder,
                cmsTargetId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }
}
