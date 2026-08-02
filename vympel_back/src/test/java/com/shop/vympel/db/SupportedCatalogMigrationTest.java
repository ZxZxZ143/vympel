package com.shop.vympel.db;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class SupportedCatalogMigrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vympel_supported_catalog")
            .withUsername("vympel")
            .withPassword("supported-catalog-test-password");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void migrationBuildsTheExactSupportedDomainAndLocalizedLabels() {
        assertThat(jdbcTemplate.queryForObject("select count(*) from brand", Long.class)).isEqualTo(6);
        assertThat(jdbcTemplate.queryForObject("select count(*) from country", Long.class)).isEqualTo(5);
        assertThat(jdbcTemplate.queryForObject("select count(*) from brand_country", Long.class)).isEqualTo(6);

        assertThat(jdbcTemplate.queryForList(
                """
                select b.name || ' -> ' || ci.name
                from brand b
                join brand_country bc on bc.brand_id = b.id
                join country_i18n ci on ci.country_id = bc.country_id and ci.lang = 'en'
                order by b.code
                """,
                String.class
        )).containsExactly(
                "Adriatica -> Switzerland",
                "Appella -> Switzerland",
                "Pierre Ricaud -> Germany",
                "Rhythm -> Japan",
                "Romanson -> South Korea",
                "Royal London -> England"
        );

        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from country_i18n where lang in ('ru', 'en', 'kk')",
                Long.class
        )).isEqualTo(15);
        assertThat(jdbcTemplate.queryForList(
                "select name from country_i18n where lang = 'kk' order by name",
                String.class
        )).containsExactlyInAnyOrder("Англия", "Германия", "Жапония", "Оңтүстік Корея", "Швейцария");
    }

    @Test
    void databaseRejectsUnsupportedRowsAndMappingDrift() {
        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into brand(code, name, active) values ('unsupported', 'Unsupported', true)"
        )).isInstanceOf(DataIntegrityViolationException.class);

        Long romansonId = jdbcTemplate.queryForObject("select id from brand where code='romanson'", Long.class);
        Long switzerlandId = jdbcTemplate.queryForObject("select id from country where iso2='CH'", Long.class);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "update brand_country set country_id=? where brand_id=?",
                switzerlandId,
                romansonId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void migrationContractContainsOnlyClearAliasConversionsAndFkSafeProductDeletion() throws Exception {
        byte[] bytes = getClass().getClassLoader()
                .getResourceAsStream("db/changelog/2026-08-02-01-supported-brand-country-domain.xml")
                .readAllBytes();
        String migration = new String(bytes, StandardCharsets.UTF_8).toLowerCase();

        assertThat(migration).contains("rierrericaud", "adriaica", "rythm", "pierrericaude");
        assertThat(migration).contains(
                "ambiguous country identity cannot be normalized automatically",
                "ambiguous brand identity cannot be normalized automatically"
        );
        assertThat(migration).contains("delete from product", "on delete cascade", "delete from brand", "delete from country");
        assertThat(migration).doesNotContain("delete from product_i18n", "delete from product_category");
    }
}
