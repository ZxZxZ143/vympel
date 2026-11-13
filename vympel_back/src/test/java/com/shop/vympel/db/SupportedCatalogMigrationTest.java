package com.shop.vympel.db;

import com.shop.vympel.dtos.crm.CrmBrandCreateRequest;
import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmCountryCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.services.catalog.SupportedCatalogDomainService;
import com.shop.vympel.services.crm.CrmBrandService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
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

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private CrmBrandService crmBrandService;

    @Autowired
    private SupportedCatalogDomainService supportedCatalogDomainService;

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
    void databaseRejectsBrandsWithoutCountryAndMalformedIdentities() {
        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into brand(code, name, active) values ('orphan', 'Orphan', true)"
        )).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into brand(code, name, active) values ('Bad Code', 'Bad', true)"
        )).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into country(code, iso2, active) values ('nowhere', 'X1', true)"
        )).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into country(code, iso2, active) values ('nowhere', 'XN', true)"
        )).isInstanceOf(DataIntegrityViolationException.class);

        Long romansonId = jdbcTemplate.queryForObject("select id from brand where code='romanson'", Long.class);
        assertThatThrownBy(() -> jdbcTemplate.update("delete from brand_country where brand_id=?", romansonId))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbcTemplate.queryForObject("select count(*) from brand", Long.class)).isEqualTo(6);
    }

    @Test
    void crmCreatesBrandsWithExistingOrNewCountryAndRejectsDuplicates() {
        Long switzerlandId = jdbcTemplate.queryForObject("select id from country where iso2='CH'", Long.class);

        transactionTemplate.executeWithoutResult(status -> {
            CrmBrandReferenceOptionResponse brand = crmBrandService.create(
                    new CrmBrandCreateRequest("  Swiss   Military ", switzerlandId, null), Language.EN);
            assertThat(brand.code()).isEqualTo("swiss-military");
            assertThat(brand.name()).isEqualTo("Swiss Military");
            assertThat(brand.countryId()).isEqualTo(switzerlandId);
            assertThat(brand.countryName()).isEqualTo("Switzerland");

            CrmBrandReferenceOptionResponse withNewCountry = crmBrandService.create(
                    new CrmBrandCreateRequest("Orient", null,
                            new CrmCountryCreateRequest("cn", "Китай", "China", "Қытай")), Language.RU);
            assertThat(withNewCountry.countryCode()).isEqualTo("china");
            assertThat(withNewCountry.countryName()).isEqualTo("Китай");
            assertThat(jdbcTemplate.queryForObject(
                    "select iso2 from country where id=?", String.class, withNewCountry.countryId())).isEqualTo("CN");

            jdbcTemplate.execute("SET CONSTRAINTS ALL IMMEDIATE");

            assertThatThrownBy(() -> crmBrandService.create(
                    new CrmBrandCreateRequest("ROMANSON", switzerlandId, null), Language.RU))
                    .isInstanceOfSatisfying(BusinessRuleViolationException.class,
                            error -> assertThat(error.getCode()).isEqualTo("BRAND_EXISTS"));
            assertThatThrownBy(() -> crmBrandService.create(
                    new CrmBrandCreateRequest("Seiko", null,
                            new CrmCountryCreateRequest("JP", "Япония", "Japan", "Жапония")), Language.RU))
                    .isInstanceOfSatisfying(BusinessRuleViolationException.class,
                            error -> assertThat(error.getCode()).isEqualTo("COUNTRY_EXISTS"));
            assertThatThrownBy(() -> crmBrandService.create(
                    new CrmBrandCreateRequest("Победа", switzerlandId, null), Language.RU))
                    .isInstanceOfSatisfying(BusinessRuleViolationException.class,
                            error -> assertThat(error.getCode()).isEqualTo("BRAND_NAME_INVALID"));

            assertThat(supportedCatalogDomainService.supportedBrandIds()).contains(brand.id(), withNewCountry.id());
            status.setRollbackOnly();
        });

        assertThat(jdbcTemplate.queryForObject("select count(*) from brand", Long.class)).isEqualTo(6);
    }

    @Test
    void crmDeletesOnlyUnusedNonStorefrontBrandsAndKeepsTheirCountry() {
        Long romansonId = jdbcTemplate.queryForObject("select id from brand where code='romanson'", Long.class);

        transactionTemplate.executeWithoutResult(status -> {
            CrmBrandReferenceOptionResponse brand = crmBrandService.create(
                    new CrmBrandCreateRequest("Orient", null,
                            new CrmCountryCreateRequest("CN", "Китай", "China", "Қытай")), Language.RU);
            assertThat(brand.deletable()).isTrue();
            jdbcTemplate.update(
                    "insert into collection(brand_id, code, name, active) values (?, 'STAR', 'Star', true)", brand.id());
            jdbcTemplate.execute("SET CONSTRAINTS ALL IMMEDIATE");

            CrmBrandService.DeletedBrand deleted = crmBrandService.delete(brand.id());
            jdbcTemplate.execute("SET CONSTRAINTS ALL IMMEDIATE");

            assertThat(deleted.code()).isEqualTo("orient");
            assertThat(deleted.deletedCollections()).isEqualTo(1);
            assertThat(jdbcTemplate.queryForObject(
                    "select count(*) from brand where id=?", Long.class, brand.id())).isZero();
            assertThat(jdbcTemplate.queryForObject(
                    "select count(*) from collection where brand_id=?", Long.class, brand.id())).isZero();
            assertThat(supportedCatalogDomainService.selectableCountries())
                    .extracting(country -> country.getIso2())
                    .contains("CN");

            assertThatThrownBy(() -> crmBrandService.delete(romansonId))
                    .isInstanceOfSatisfying(BusinessRuleViolationException.class,
                            error -> assertThat(error.getCode()).isEqualTo("BRAND_PROTECTED"));
            status.setRollbackOnly();
        });

        transactionTemplate.executeWithoutResult(status -> {
            Long switzerlandId = jdbcTemplate.queryForObject("select id from country where iso2='CH'", Long.class);
            CrmBrandReferenceOptionResponse brand = crmBrandService.create(
                    new CrmBrandCreateRequest("Swiss Military", switzerlandId, null), Language.RU);
            jdbcTemplate.update(
                    "insert into product(model, sku, price, stock_quantity, status, product_type, brand_id) "
                            + "values ('In use', 'brand-delete-in-use', 1, 0, 'DRAFT', 'WATCH', ?)",
                    brand.id());

            assertThatThrownBy(() -> crmBrandService.delete(brand.id()))
                    .isInstanceOfSatisfying(BusinessRuleViolationException.class,
                            error -> assertThat(error.getCode()).isEqualTo("BRAND_IN_USE"));
            status.setRollbackOnly();
        });

        assertThat(jdbcTemplate.queryForObject("select count(*) from brand", Long.class)).isEqualTo(6);
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
