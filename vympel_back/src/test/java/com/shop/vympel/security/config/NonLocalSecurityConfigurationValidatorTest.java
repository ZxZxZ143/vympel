package com.shop.vympel.security.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NonLocalSecurityConfigurationValidatorTest {
    @Test
    void localAndTestProfilesAreExplicitlyExempt() {
        MockEnvironment local = new MockEnvironment();
        local.setActiveProfiles("local");
        MockEnvironment test = new MockEnvironment();
        test.setActiveProfiles("test");

        assertDoesNotThrow(() -> NonLocalSecurityConfigurationValidator.validate(local));
        assertDoesNotThrow(() -> NonLocalSecurityConfigurationValidator.validate(test));
    }

    @Test
    void localProfileCannotBeMixedIntoProduction() {
        MockEnvironment environment = validProductionEnvironment();
        environment.setActiveProfiles("production", "local");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> NonLocalSecurityConfigurationValidator.validate(environment));
        assertTrue(exception.getMessage().contains("must not be combined"));
    }

    @Test
    void missingAndPlaceholderSecretsFailWithoutEchoingValues() {
        MockEnvironment environment = validProductionEnvironment()
                .withProperty("security.jwt.secret", "change-me-super-secret-that-must-not-be-echoed");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> NonLocalSecurityConfigurationValidator.validate(environment));

        assertTrue(exception.getMessage().contains("JWT secret"));
        assertFalse(exception.getMessage().contains("must-not-be-echoed"));
    }

    @Test
    void weakJwtMissingDatabaseDefaultStorageAndWildcardCorsFail() {
        MockEnvironment environment = validProductionEnvironment()
                .withProperty("security.jwt.secret", "weak")
                .withProperty("spring.datasource.password", "123")
                .withProperty("storage.s3.access-key", "minioadmin")
                .withProperty("app.cors.allowed-origins", "*")
                .withProperty("security.rate-limit.storage", "memory");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> NonLocalSecurityConfigurationValidator.validate(environment));
        assertTrue(exception.getMessage().contains("JWT secret"));
        assertTrue(exception.getMessage().contains("database password"));
        assertTrue(exception.getMessage().contains("object-storage access key"));
        assertTrue(exception.getMessage().contains("CORS"));
        assertTrue(exception.getMessage().contains("Redis"));
    }

    @Test
    void cmsSecretAndUrlAreRequiredForNonLocalCmsEditing() {
        MockEnvironment environment = validProductionEnvironment()
                .withProperty("app.cms.public-revalidate.enabled", "true")
                .withProperty("app.cms.public-revalidate.required", "true")
                .withProperty("app.cms.public-revalidate.url", "")
                .withProperty("app.cms.public-revalidate.secret", "");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> NonLocalSecurityConfigurationValidator.validate(environment));
        assertTrue(exception.getMessage().contains("CMS revalidation URL"));
        assertTrue(exception.getMessage().contains("CMS revalidation secret"));
    }

    @Test
    void productionCannotDisableApplicationRateLimiting() {
        MockEnvironment environment = validProductionEnvironment()
                .withProperty("security.rate-limit.enabled", "false");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> NonLocalSecurityConfigurationValidator.validate(environment));

        assertTrue(exception.getMessage().contains("rate limiting must be enabled"));
    }

    @Test
    void corsMustContainExactHttpsOriginsOnly() {
        MockEnvironment environment = validProductionEnvironment()
                .withProperty("app.cors.allowed-origins", "https://user@shop.example.com/path?debug=true");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> NonLocalSecurityConfigurationValidator.validate(environment));
        assertTrue(exception.getMessage().contains("CORS origin"));
        assertFalse(exception.getMessage().contains("user@shop.example.com"));
    }

    @Test
    void validProductionLikeConfigurationPasses() {
        assertDoesNotThrow(() -> NonLocalSecurityConfigurationValidator.validate(validProductionEnvironment()));
    }

    private MockEnvironment validProductionEnvironment() {
        String jwt = "A7!jwt-Production-Key-9xQ2#Lm5$Vr8@Tn1%Pw4&Ks6*Hd3";
        String hmac = "B8!rate-Limit-Hmac-4zW3#Nk6$Us9@Qo2%Xe5&Jt7*Gc1+Fy0";
        return new MockEnvironment()
                .withProperty("security.jwt.secret", jwt)
                .withProperty("security.rate-limit.hmac-secret", hmac)
                .withProperty("security.rate-limit.storage", "redis")
                .withProperty("spring.data.redis.url", "rediss://redis.example.internal:6380")
                .withProperty("spring.datasource.url", "jdbc:postgresql://db.example.internal:5432/vympel")
                .withProperty("spring.datasource.username", "vympel_app")
                .withProperty("spring.datasource.password", "D9!db-Password-Strong")
                .withProperty("storage.s3.endpoint", "https://objects.example.com")
                .withProperty("storage.s3.public-endpoint", "https://media.example.com")
                .withProperty("storage.s3.bucket", "vympel-prod")
                .withProperty("storage.s3.access-key", "prod-access-9X")
                .withProperty("storage.s3.secret-key", "S3!strong-secret-8Q")
                .withProperty("app.cors.allowed-origins", "https://shop.example.com,https://crm.example.com")
                .withProperty("security.crm-session.secure", "true")
                .withProperty("app.cms.public-revalidate.enabled", "true")
                .withProperty("app.cms.public-revalidate.required", "true")
                .withProperty("app.cms.public-revalidate.url", "https://shop.example.com/api/revalidate")
                .withProperty("app.cms.public-revalidate.secret", "C9!cms-Revalidation-Key-7vT4#Lm8$Qr2@Wp6%Xs5&Hd1+Nz0");
    }
}
