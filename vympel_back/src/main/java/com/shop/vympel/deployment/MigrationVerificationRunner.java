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

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@ConditionalOnProperty(prefix = "vympel", name = "migration-only", havingValue = "true")
public class MigrationVerificationRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(MigrationVerificationRunner.class);

    private final JdbcTemplate jdbcTemplate;
    private final ConfigurableApplicationContext applicationContext;

    public MigrationVerificationRunner(
            JdbcTemplate jdbcTemplate,
            ConfigurableApplicationContext applicationContext
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.applicationContext = applicationContext;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer appliedChanges = jdbcTemplate.queryForObject(
                "select count(*) from databasechangelog",
                Integer.class
        );
        String latestChange = jdbcTemplate.queryForObject(
                "select id from databasechangelog order by orderexecuted desc limit 1",
                String.class
        );
        if (appliedChanges == null || appliedChanges < 1 || latestChange == null || latestChange.isBlank()) {
            throw new IllegalStateException("Liquibase migration verification did not find an applied changelog");
        }

        log.info(
                "Liquibase migration verification passed appliedChanges={} latestChange={}",
                appliedChanges,
                latestChange
        );
        applicationContext.close();
    }
}
