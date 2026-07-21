package com.shop.vympel.s3;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "storage.s3")
@Validated
public record StorageProps(
        @NotBlank
        String bucket,
        @NotBlank
        String region,
        @NotBlank
        String endpoint,
        @NotBlank
        String publicEndpoint,
        @NotBlank
        String accessKey,
        @NotBlank
        String secretKey,
        boolean pathStyle
) {}
