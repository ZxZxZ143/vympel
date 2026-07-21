package com.shop.vympel.bootstrap.admin;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class LocalAdminBootstrapRunnerTest {
    private static final String PASSWORD = "StrongLocal_2026_Admin9!";

    @Test
    void disabledBootstrapDoesNotInvokeService() {
        BootstrapAdminProperties properties = new BootstrapAdminProperties();
        LocalAdminBootstrapService service = mock(LocalAdminBootstrapService.class);

        new LocalAdminBootstrapRunner(properties, service).run(mock(ApplicationArguments.class));

        verifyNoInteractions(service);
    }

    @Test
    void enabledBootstrapRejectsMissingConfigurationWithoutInvokingService() {
        BootstrapAdminProperties properties = new BootstrapAdminProperties();
        properties.setEnabled(true);
        LocalAdminBootstrapService service = mock(LocalAdminBootstrapService.class);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> new LocalAdminBootstrapRunner(properties, service).run(mock(ApplicationArguments.class))
        );

        assertTrue(exception.getMessage().contains("email is required"));
        assertTrue(exception.getMessage().contains("password is required"));
        verifyNoInteractions(service);
    }

    @Test
    void enabledBootstrapRejectsWeakPassword() {
        BootstrapAdminProperties properties = enabledProperties();
        properties.setPassword("weak-password");

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                properties::validateForEnabledBootstrap
        );

        assertTrue(exception.getMessage().contains("upper, lower, digit, symbol"));
        assertFalse(exception.getMessage().contains("weak-password"));
    }

    @Test
    void concurrentUniqueConflictIsResolvedAsExistingAdmin() {
        BootstrapAdminProperties properties = enabledProperties();
        LocalAdminBootstrapService service = mock(LocalAdminBootstrapService.class);
        when(service.bootstrap(properties)).thenThrow(new DataIntegrityViolationException("unique conflict"));
        when(service.resolveAfterConcurrentConflict("local.admin@vympel.test"))
                .thenReturn(LocalAdminBootstrapService.BootstrapResult.EXISTING_ADMIN);

        new LocalAdminBootstrapRunner(properties, service).run(mock(ApplicationArguments.class));

        verify(service).resolveAfterConcurrentConflict("local.admin@vympel.test");
    }

    @Test
    void startupLogsNeverContainPlaintextOrEncodedPassword() {
        BootstrapAdminProperties properties = enabledProperties();
        LocalAdminBootstrapService service = mock(LocalAdminBootstrapService.class);
        when(service.bootstrap(properties)).thenReturn(LocalAdminBootstrapService.BootstrapResult.CREATED);
        Logger logger = (Logger) LoggerFactory.getLogger(LocalAdminBootstrapRunner.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            new LocalAdminBootstrapRunner(properties, service).run(mock(ApplicationArguments.class));
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }

        String logs = appender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .collect(Collectors.joining("\n"));
        assertFalse(logs.contains(PASSWORD));
        assertFalse(logs.contains("$2a$10$encoded-password-marker"));
        assertFalse(properties.toString().contains(PASSWORD));
    }

    private BootstrapAdminProperties enabledProperties() {
        BootstrapAdminProperties properties = new BootstrapAdminProperties();
        properties.setEnabled(true);
        properties.setEmail(" Local.Admin@Vympel.Test ");
        properties.setPassword(PASSWORD);
        properties.setName("Local Administrator");
        return properties;
    }
}
