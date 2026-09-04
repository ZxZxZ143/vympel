package com.shop.vympel.deployment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@ConditionalOnProperty(prefix = "vympel", name = "migration-only", havingValue = "true")
public class MigrationVerificationRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(MigrationVerificationRunner.class);
    static final String APPLIED_CHANGES_SQL =
            "select id, author, filename from databasechangelog order by orderexecuted";

    private final JdbcTemplate jdbcTemplate;
    private final ConfigurableApplicationContext applicationContext;
    private final LiquibaseChangeBoundary changeBoundary;

    public MigrationVerificationRunner(
            JdbcTemplate jdbcTemplate,
            ConfigurableApplicationContext applicationContext,
            LiquibaseChangeBoundary changeBoundary
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.applicationContext = applicationContext;
        this.changeBoundary = changeBoundary;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<LiquibaseChangeBoundary.ChangeIdentity> appliedChanges = jdbcTemplate.query(
                APPLIED_CHANGES_SQL,
                (resultSet, rowNumber) -> new LiquibaseChangeBoundary.ChangeIdentity(
                        resultSet.getString("id"),
                        resultSet.getString("author"),
                        resultSet.getString("filename")
                )
        );
        if (appliedChanges.isEmpty()) {
            throw new IllegalStateException("Liquibase migration verification did not find an applied changelog");
        }
        LiquibaseChangeBoundary.ChangeIdentity expectedLatestChange = changeBoundary.expectedLatestChange();
        if (!appliedChanges.contains(expectedLatestChange)) {
            throw new IllegalStateException(
                    "Liquibase migration verification expected latest change " + expectedLatestChange
                            + " but it is not applied"
            );
        }
        Set<LiquibaseChangeBoundary.ChangeIdentity> packagedChanges = changeBoundary.packagedChanges();
        appliedChanges.stream()
                .filter(change -> !packagedChanges.contains(change))
                .findFirst()
                .ifPresent(change -> {
                    throw new IllegalStateException(
                            "Liquibase migration verification found a database change not packaged by this release: "
                                    + change
                    );
                });

        LiquibaseChangeBoundary.ChangeIdentity latestExecutedChange =
                appliedChanges.get(appliedChanges.size() - 1);

        log.info(
                "Liquibase migration verification passed appliedChanges={} latestChange={}",
                appliedChanges.size(),
                latestExecutedChange.id()
        );
        applicationContext.close();
    }
}
