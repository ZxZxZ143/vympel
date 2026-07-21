package com.shop.vympel.security.jwt;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Setter
@Getter
@ConfigurationProperties(prefix = "security.jwt")
@Validated
public class JwtProperties {

    @NotBlank
    @Size(min = 32)
    private String secret;

    @Min(1)
    private long accessTtlMin;

    @Min(1)
    private long refreshTtlDays;

    @NotBlank
    private String issuer;

    @NotBlank
    private String audience;

    @Min(0)
    @Max(120)
    private long clockSkewSeconds;

}
