package com.shop.vympel.enums;

import lombok.Getter;

@Getter
public enum Language {
    EN("en"),
    RU("ru"),
    KZ("kk");

    private final String value;

    Language(String value) {
        this.value = value;
    }

    public static Language from(String s) {
        if (s == null) return null;
        s = s.trim().toLowerCase();
        return switch (s) {
            case "ru" -> RU;
            case "en" -> EN;
            case "kk", "kz" -> KZ;
            default -> throw new IllegalArgumentException("Unsupported lang: " + s);
        };
    }
}
