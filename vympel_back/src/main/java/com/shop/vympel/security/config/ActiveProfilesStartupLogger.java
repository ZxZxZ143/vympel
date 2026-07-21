package com.shop.vympel.security.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class ActiveProfilesStartupLogger implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ActiveProfilesStartupLogger.class);

    private final Environment environment;

    public ActiveProfilesStartupLogger(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> profiles = Arrays.stream(environment.getActiveProfiles()).sorted().toList();
        log.info("Vympel startup active Spring profiles={}", profiles.isEmpty() ? List.of("<none>") : profiles);
    }
}
