package com.shop.vympel.bootstrap.admin;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Validated
@ConfigurationProperties(prefix = "vympel.bootstrap.admin")
public class BootstrapAdminProperties {
    private static final int MIN_PASSWORD_LENGTH = 16;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private boolean enabled;
    private String email;
    private String password;
    private String name;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void validateForEnabledBootstrap() {
        if (!enabled) {
            return;
        }

        List<String> errors = new ArrayList<>();
        if (email == null || email.isBlank()) {
            errors.add("email is required");
        } else if (email.length() > 255 || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            errors.add("email must be valid and at most 255 characters");
        }

        if (password == null || password.isBlank()) {
            errors.add("password is required");
        } else if (!isStrongPassword(password)) {
            errors.add("password must be 16-255 characters with upper, lower, digit, symbol, and sufficient variety");
        }

        if (name != null && name.trim().length() > 100) {
            errors.add("name must be at most 100 characters");
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Invalid local ADMIN bootstrap configuration: " + String.join("; ", errors));
        }
    }

    public String normalizedEmail() {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public String normalizedName() {
        if (name == null || name.isBlank()) {
            return null;
        }
        return name.trim();
    }

    private boolean isStrongPassword(String candidate) {
        if (candidate.length() < MIN_PASSWORD_LENGTH || candidate.length() > 255) {
            return false;
        }

        boolean upper = false;
        boolean lower = false;
        boolean digit = false;
        boolean symbol = false;
        for (int index = 0; index < candidate.length(); index++) {
            char value = candidate.charAt(index);
            upper |= Character.isUpperCase(value);
            lower |= Character.isLowerCase(value);
            digit |= Character.isDigit(value);
            symbol |= !Character.isLetterOrDigit(value);
        }

        return upper && lower && digit && symbol && candidate.chars().distinct().count() >= 10;
    }

    @Override
    public String toString() {
        return "BootstrapAdminProperties{" +
                "enabled=" + enabled +
                ", emailConfigured=" + (email != null && !email.isBlank()) +
                ", passwordConfigured=" + (password != null && !password.isBlank()) +
                ", nameConfigured=" + (name != null && !name.isBlank()) +
                '}';
    }
}
