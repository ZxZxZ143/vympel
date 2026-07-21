package com.shop.vympel.security.ratelimit;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "security.rate-limit")
public class RateLimitProperties {
    private boolean enabled = true;

    @NotBlank
    @Pattern(regexp = "memory|redis", flags = Pattern.Flag.CASE_INSENSITIVE)
    private String storage = "redis";

    @NotBlank
    @Size(max = 100)
    private String keyPrefix = "vympel:rate-limit:v1";

    @Size(min = 32, max = 512)
    private String hmacSecret;

    private List<String> trustedProxies = List.of();

    @Min(100)
    @Max(1_000_000)
    private int maxLocalEntries = 10_000;

    @Min(2)
    @Max(10)
    private int loginBackoffThreshold = 3;

    @Min(1)
    @Max(60)
    private int loginBackoffBaseSeconds = 2;

    @Min(2)
    @Max(3600)
    private int loginBackoffMaxSeconds = 300;

    @NotEmpty
    private Map<String, @Valid Policy> policies = new LinkedHashMap<>();

    @AssertTrue(message = "rate-limit HMAC secret is required when rate limiting is enabled")
    public boolean isHmacConfigurationValid() {
        return !enabled || (hmacSecret != null && !hmacSecret.isBlank() && hmacSecret.length() >= 32);
    }

    @Getter
    @Setter
    public static class Policy {
        @Min(1)
        @Max(10_000_000)
        private long capacity;

        @Min(1)
        @Max(604_800)
        private long windowSeconds;

        private boolean failOpen;
    }
}
