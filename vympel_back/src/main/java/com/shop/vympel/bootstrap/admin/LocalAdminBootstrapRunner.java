package com.shop.vympel.bootstrap.admin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Component
public class LocalAdminBootstrapRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(LocalAdminBootstrapRunner.class);

    private final BootstrapAdminProperties properties;
    private final LocalAdminBootstrapService service;

    public LocalAdminBootstrapRunner(
            BootstrapAdminProperties properties,
            LocalAdminBootstrapService service
    ) {
        this.properties = properties;
        this.service = service;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            log.info("ADMIN bootstrap is disabled");
            return;
        }

        properties.validateForEnabledBootstrap();
        LocalAdminBootstrapService.BootstrapResult result;
        try {
            result = service.bootstrap(properties);
        } catch (DataIntegrityViolationException conflict) {
            result = service.resolveAfterConcurrentConflict(properties.normalizedEmail());
        }

        if (result == LocalAdminBootstrapService.BootstrapResult.CREATED) {
            log.info("ADMIN bootstrap created the configured account");
        } else {
            log.info("ADMIN bootstrap already satisfied; no account changes applied");
        }
    }
}
