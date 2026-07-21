package com.shop.vympel.deployment;

import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MigrationVerificationRunnerTest {

    @Test
    void verifiesAppliedLiquibaseHistoryAndClosesTheMigrationJob() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(jdbcTemplate.queryForObject("select count(*) from databasechangelog", Integer.class))
                .thenReturn(77);
        when(jdbcTemplate.queryForObject(
                "select id from databasechangelog order by orderexecuted desc limit 1",
                String.class
        )).thenReturn("2026-07-19-02-public-image-webp");

        new MigrationVerificationRunner(jdbcTemplate, context).run(mock(ApplicationArguments.class));

        verify(context).close();
    }

    @Test
    void refusesToCompleteWhenLiquibaseHistoryIsEmpty() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        when(jdbcTemplate.queryForObject("select count(*) from databasechangelog", Integer.class))
                .thenReturn(0);
        when(jdbcTemplate.queryForObject(
                "select id from databasechangelog order by orderexecuted desc limit 1",
                String.class
        )).thenReturn(null);

        MigrationVerificationRunner runner = new MigrationVerificationRunner(jdbcTemplate, context);

        assertThrows(
                IllegalStateException.class,
                () -> runner.run(mock(ApplicationArguments.class))
        );
        verify(context, never()).close();
    }
}
