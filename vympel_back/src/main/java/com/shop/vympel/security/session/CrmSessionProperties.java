package com.shop.vympel.security.session;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "security.crm-session")
public class CrmSessionProperties {
    @NotBlank
    private String cookieName;

    @NotBlank
    private String cookiePath;

    private boolean secure;

    @NotBlank
    @Pattern(regexp = "Lax|Strict")
    private String sameSite;

    @Min(1)
    private long cleanupRetentionDays;
}
