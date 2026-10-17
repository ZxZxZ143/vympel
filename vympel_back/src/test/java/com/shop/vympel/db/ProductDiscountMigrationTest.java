package com.shop.vympel.db;

import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.DirectoryResourceAccessor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers(disabledWithoutDocker = true)
class ProductDiscountMigrationTest {
    private static final String MASTER = "db/changelog/db.changelog-master.xml";
    private static final String DISCOUNT_CHANGE = "2026-10-17-01-product-discounts";
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vympel_discount_upgrade")
            .withUsername("vympel")
            .withPassword("isolated-discount-upgrade-test-only");
    @TempDir Path baselineResources;

    @Test
    void upgradesPopulatedPreviousSchemaWithoutRewritingHistoryOrProductData() throws Exception {
        Path currentResources = Path.of("src/main/resources");
        try (var paths = Files.walk(currentResources.resolve("db/changelog"))) {
            for (Path source : paths.filter(Files::isRegularFile).toList()) {
                Path target = baselineResources.resolve(currentResources.relativize(source));
                Files.createDirectories(target.getParent());
                Files.copy(source, target);
            }
        }
        Path master = baselineResources.resolve(MASTER);
        String baseline = Files.readString(master).replaceAll(
                "(?m)^.*<include[^>]*2026-10-17-01-product-discounts\\.xml[^>]*/>\\s*", "");
        assertThat(baseline).doesNotContain(DISCOUNT_CHANGE);
        Files.writeString(master, baseline);

        try (Connection connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())) {
            update(connection, baselineResources);
            execute(connection, """
                    INSERT INTO product(model,sku,price,stock_quantity,status,product_type,brand_id)
                    SELECT 'Upgrade fixture', 'upgrade-' || state, 1001.00, 3, state, 'WATCH', id
                    FROM brand CROSS JOIN (VALUES ('DRAFT'), ('ACTIVE'), ('ARCHIVED')) AS states(state)
                    WHERE code = 'romanson'
                    """);
            List<String> products = rows(connection, "SELECT (row_to_json(p)::jsonb - 'discount_percent')::text FROM product p ORDER BY id");
            List<String> history = rows(connection, "SELECT id || ':' || author || ':' || filename || ':' || md5sum FROM databasechangelog ORDER BY orderexecuted");
            List<String> references = rows(connection, "SELECT json_build_array((SELECT count(*) FROM collection),(SELECT count(*) FROM material),(SELECT count(*) FROM interior_feature))::text");

            update(connection, currentResources);
            assertThat(rows(connection, "SELECT (row_to_json(p)::jsonb - 'discount_percent')::text FROM product p ORDER BY id")).isEqualTo(products);
            assertThat(rows(connection, "SELECT id || ':' || author || ':' || filename || ':' || md5sum FROM databasechangelog WHERE id <> '" + DISCOUNT_CHANGE + "' ORDER BY orderexecuted")).isEqualTo(history);
            assertThat(rows(connection, "SELECT json_build_array((SELECT count(*) FROM collection),(SELECT count(*) FROM material),(SELECT count(*) FROM interior_feature))::text")).isEqualTo(references);
            assertThat(rows(connection, "SELECT count(*)::text FROM product WHERE discount_percent IS NOT NULL")).containsExactly("0");
            assertThat(rows(connection, "SELECT id FROM databasechangelog ORDER BY orderexecuted DESC LIMIT 1")).containsExactly(DISCOUNT_CHANGE);

            for (int invalid : new int[]{-1, 0, 100}) {
                assertThatThrownBy(() -> execute(connection, "UPDATE product SET discount_percent=" + invalid + " WHERE sku='upgrade-ACTIVE'"))
                        .isInstanceOf(SQLException.class).hasMessageContaining("chk_product_discount_percent");
            }
            execute(connection, "UPDATE product SET discount_percent=1 WHERE sku='upgrade-ACTIVE'");
            execute(connection, "UPDATE product SET discount_percent=99 WHERE sku='upgrade-DRAFT'");
            assertThat(rows(connection, "SELECT discount_percent::text FROM product WHERE sku LIKE 'upgrade-%' AND discount_percent IS NOT NULL ORDER BY discount_percent")).containsExactly("1", "99");
            execute(connection, "UPDATE product SET discount_percent=NULL WHERE sku LIKE 'upgrade-%'");
            update(connection, currentResources);
            assertThat(rows(connection, "SELECT count(*)::text FROM databasechangelog WHERE id='" + DISCOUNT_CHANGE + "'")).containsExactly("1");
        }
    }

    private static void update(Connection connection, Path resources) throws Exception {
        // Keep the JDBC connection available for before/after assertions; the outer try owns it.
        try (var accessor = new DirectoryResourceAccessor(resources)) {
            new Liquibase(MASTER, accessor, new JdbcConnection(connection)).update(new Contexts(), new LabelExpression());
            // Liquibase changes the connection mode; each rejected write must have its own transaction.
            connection.setAutoCommit(true);
        }
    }

    private static void execute(Connection connection, String sql) throws SQLException {
        try (var statement = connection.createStatement()) { statement.execute(sql); }
    }

    private static List<String> rows(Connection connection, String sql) throws SQLException {
        List<String> values = new ArrayList<>();
        try (var statement = connection.createStatement(); var result = statement.executeQuery(sql)) {
            while (result.next()) values.add(result.getString(1));
        }
        return values;
    }
}
