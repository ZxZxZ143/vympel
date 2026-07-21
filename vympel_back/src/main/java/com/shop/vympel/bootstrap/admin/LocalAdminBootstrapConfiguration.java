package com.shop.vympel.bootstrap.admin;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("local")
@EnableConfigurationProperties(BootstrapAdminProperties.class)
public class LocalAdminBootstrapConfiguration {
}
