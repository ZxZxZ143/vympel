package com.shop.vympel.logging;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public final class SensitiveDataMasker {
    public static final String REDACTED = "[REDACTED]";

    private static final int MAX_LOG_VALUE_LENGTH = 512;
    private static final int MAX_METADATA_ITEMS = 20;
    private static final String SENSITIVE_KEY_EXPRESSION =
            "password(?:[_-]?confirmation)?|passwd|pwd|authorization|"
                    + "refresh[_-]?token|access[_-]?token|jwt|"
                    + "secret(?:[_-]?key)?|access[_-]?key|"
                    + "database[_-]?password|db[_-]?password|"
                    + "minio[_-]?(?:secret|password)|cookie";
    private static final Pattern SENSITIVE_KEY_VALUE = Pattern.compile(
            "(?i)((?:[\"']?)(?:" + SENSITIVE_KEY_EXPRESSION
                    + ")(?:[\"']?)\\s*[:=]\\s*)"
                    + "(?:\"[^\"]*\"|'[^']*'|[^,\\s;}\\]]+)"
    );
    private static final Pattern SENSITIVE_KEY = Pattern.compile(
            "(?i).*(" + SENSITIVE_KEY_EXPRESSION + ").*"
    );
    private static final Pattern BEARER_TOKEN = Pattern.compile(
            "(?i)(\\bBearer\\s+)[A-Za-z0-9._~+/=-]+"
    );
    private static final Pattern JWT_TOKEN = Pattern.compile(
            "(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{5,}\\.[A-Za-z0-9_-]{5,}\\.[A-Za-z0-9_-]{10,}(?![A-Za-z0-9_-])"
    );
    private static final Pattern URI_CREDENTIALS = Pattern.compile(
            "(?i)(\\b[a-z][a-z0-9+.-]*://[^\\s/:@]+:)[^\\s/@]+(@)"
    );
    private static final Pattern TECHNICAL_MESSAGE = Pattern.compile(
            "(?i)(exception|stack\\s*trace|org\\.|java\\.|jakarta\\.|hibernate|"
                    + "sqlstate|syntax error|at\\s+[\\w.$]+\\()"
    );

    private SensitiveDataMasker() {
    }

    public static String mask(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        String masked = SENSITIVE_KEY_VALUE.matcher(value).replaceAll("$1" + REDACTED);
        masked = BEARER_TOKEN.matcher(masked).replaceAll("$1" + REDACTED);
        masked = JWT_TOKEN.matcher(masked).replaceAll(REDACTED);
        return URI_CREDENTIALS.matcher(masked).replaceAll("$1" + REDACTED + "$2");
    }

    public static String sanitizeForLog(String value) {
        if (value == null) {
            return null;
        }

        String sanitized = mask(value)
                .replace('\r', ' ')
                .replace('\n', ' ')
                .replace('\t', ' ')
                .replaceAll("\\p{Cntrl}", "")
                .trim();
        if (sanitized.length() <= MAX_LOG_VALUE_LENGTH) {
            return sanitized;
        }
        return sanitized.substring(0, MAX_LOG_VALUE_LENGTH) + "...";
    }

    public static String safeClientMessage(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        String sanitized = sanitizeForLog(value);
        if (sanitized == null
                || sanitized.contains(REDACTED)
                || TECHNICAL_MESSAGE.matcher(sanitized).find()) {
            return fallback;
        }

        return sanitized.length() <= 256 ? sanitized : fallback;
    }

    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "-";
        }

        String normalized = sanitizeForLog(email.toLowerCase(Locale.ROOT));
        int separator = normalized == null ? -1 : normalized.indexOf('@');
        if (separator <= 0 || separator == normalized.length() - 1) {
            return REDACTED;
        }

        return normalized.charAt(0) + "***" + normalized.substring(separator);
    }

    public static Map<String, Object> sanitizeMetadata(Map<String, Object> metadata) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        if (metadata == null || metadata.isEmpty()) {
            return sanitized;
        }

        metadata.entrySet().stream()
                .limit(MAX_METADATA_ITEMS)
                .forEach(entry -> {
                    String key = sanitizeForLog(String.valueOf(entry.getKey()));
                    sanitized.put(key, sanitizeMetadataValue(key, entry.getValue()));
                });
        return sanitized;
    }

    private static Object sanitizeMetadataValue(String key, Object value) {
        if (isSensitiveKey(key)) {
            return REDACTED;
        }
        if (key != null && key.toLowerCase(Locale.ROOT).contains("email")) {
            return maskEmail(String.valueOf(value));
        }
        if (value == null || value instanceof Number || value instanceof Boolean || value instanceof Enum<?>) {
            return value;
        }
        if (value instanceof Collection<?> collection) {
            List<Object> values = new ArrayList<>();
            collection.stream()
                    .limit(MAX_METADATA_ITEMS)
                    .forEach(item -> values.add(sanitizeMetadataValue(key, item)));
            return values;
        }
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> nested = new LinkedHashMap<>();
            map.entrySet().stream()
                    .limit(MAX_METADATA_ITEMS)
                    .forEach(entry -> {
                        String nestedKey = sanitizeForLog(String.valueOf(entry.getKey()));
                        nested.put(nestedKey, sanitizeMetadataValue(nestedKey, entry.getValue()));
                    });
            return nested;
        }
        return sanitizeForLog(String.valueOf(value));
    }

    private static boolean isSensitiveKey(String key) {
        return key != null && SENSITIVE_KEY.matcher(key).matches();
    }
}
