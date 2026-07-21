package com.shop.vympel.bootstrap.admin;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(BootstrapAdminProperties.class)
public class LocalAdminBootstrapConfiguration {
}
