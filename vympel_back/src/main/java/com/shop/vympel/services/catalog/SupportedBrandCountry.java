package com.shop.vympel.services.catalog;

import java.util.Arrays;
import java.util.Optional;

public enum SupportedBrandCountry {
    ROYAL_LONDON("royal-london", "Royal London", "GB"),
    ROMANSON("romanson", "Romanson", "KR"),
    PIERRE_RICAUD("pierre-ricaud", "Pierre Ricaud", "DE"),
    APPELLA("appella", "Appella", "CH"),
    ADRIATICA("adriatica", "Adriatica", "CH"),
    RHYTHM("rhythm", "Rhythm", "JP");

    private final String brandCode;
    private final String brandName;
    private final String countryIso2;

    SupportedBrandCountry(String brandCode, String brandName, String countryIso2) {
        this.brandCode = brandCode;
        this.brandName = brandName;
        this.countryIso2 = countryIso2;
    }

    public String brandCode() {
        return brandCode;
    }

    public String brandName() {
        return brandName;
    }

    public String countryIso2() {
        return countryIso2;
    }

    public static Optional<SupportedBrandCountry> fromBrandCode(String brandCode) {
        return Arrays.stream(values())
                .filter(value -> value.brandCode.equals(brandCode))
                .findFirst();
    }
}
