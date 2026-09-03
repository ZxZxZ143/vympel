package com.shop.vympel.deployment;

import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MigrationVerificationRunnerTest {
    private static final LiquibaseChangeBoundary.ChangeIdentity EXPECTED =
            new LiquibaseChangeBoundary.ChangeIdentity(
                    "2026-08-31-02-kaspi-product-source-links",
                    "codex",
                    "db/changelog/2026-08-31-01-stainless-steel-material.xml"
            );
    private static final LiquibaseChangeBoundary.ChangeIdentity RUN_ON_CHANGE =
            new LiquibaseChangeBoundary.ChangeIdentity(
                    "2026-02-08-04-01-seed-country",
                    "admin",
                    "db/changelog/2026-02-08-03-seed-countries.xml"
            );

    @Test
    void verifiesAppliedLiquibaseHistoryAndClosesTheMigrationJob() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        LiquibaseChangeBoundary boundary = mock(LiquibaseChangeBoundary.class);
        stubHistory(jdbcTemplate, List.of(EXPECTED));
        when(boundary.expectedLatestChange()).thenReturn(EXPECTED);
        when(boundary.packagedChanges()).thenReturn(Set.of(EXPECTED));

        new MigrationVerificationRunner(jdbcTemplate, context, boundary).run(mock(ApplicationArguments.class));

        verify(context).close();
    }

    @Test
    void permitsAPackagedRunOnChangeChangesetToExecuteAfterTheBoundary() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        LiquibaseChangeBoundary boundary = mock(LiquibaseChangeBoundary.class);
        stubHistory(jdbcTemplate, List.of(EXPECTED, RUN_ON_CHANGE));
        when(boundary.expectedLatestChange()).thenReturn(EXPECTED);
        when(boundary.packagedChanges()).thenReturn(Set.of(EXPECTED, RUN_ON_CHANGE));

        new MigrationVerificationRunner(jdbcTemplate, context, boundary).run(mock(ApplicationArguments.class));

        verify(context).close();
    }

    @Test
    void refusesToCompleteWhenLiquibaseHistoryIsEmpty() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        LiquibaseChangeBoundary boundary = mock(LiquibaseChangeBoundary.class);
        stubHistory(jdbcTemplate, List.of());

        MigrationVerificationRunner runner = new MigrationVerificationRunner(jdbcTemplate, context, boundary);

        assertThrows(IllegalStateException.class, () -> runner.run(mock(ApplicationArguments.class)));
        verify(context, never()).close();
    }

    @Test
    void refusesToCompleteWhenTheDatabaseStopsBeforeThePackagedBoundary() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        LiquibaseChangeBoundary boundary = mock(LiquibaseChangeBoundary.class);
        stubHistory(jdbcTemplate, List.of(RUN_ON_CHANGE));
        when(boundary.expectedLatestChange()).thenReturn(EXPECTED);

        MigrationVerificationRunner runner = new MigrationVerificationRunner(jdbcTemplate, context, boundary);

        assertThrows(IllegalStateException.class, () -> runner.run(mock(ApplicationArguments.class)));
        verify(context, never()).close();
    }

    @Test
    void refusesToCompleteWhenTheDatabaseContainsAChangeFromANewerRelease() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        LiquibaseChangeBoundary boundary = mock(LiquibaseChangeBoundary.class);
        LiquibaseChangeBoundary.ChangeIdentity unknown = new LiquibaseChangeBoundary.ChangeIdentity(
                "future-change", "codex", "db/changelog/future.xml"
        );
        stubHistory(jdbcTemplate, List.of(EXPECTED, unknown));
        when(boundary.expectedLatestChange()).thenReturn(EXPECTED);
        when(boundary.packagedChanges()).thenReturn(Set.of(EXPECTED));

        MigrationVerificationRunner runner = new MigrationVerificationRunner(jdbcTemplate, context, boundary);

        assertThrows(IllegalStateException.class, () -> runner.run(mock(ApplicationArguments.class)));
        verify(context, never()).close();
    }

    private void stubHistory(
            JdbcTemplate jdbcTemplate,
            List<LiquibaseChangeBoundary.ChangeIdentity> changes
    ) {
        when(jdbcTemplate.query(
                eq(MigrationVerificationRunner.APPLIED_CHANGES_SQL),
                org.mockito.ArgumentMatchers.<RowMapper<LiquibaseChangeBoundary.ChangeIdentity>>any()
        )).thenReturn(changes);
    }
}
