package com.shop.vympel.enums;

import lombok.Getter;

@Getter
public enum MediaType {
    IMAGE("IMAGE"),
    VIDEO("VIDEO");

    private final String code;

    MediaType(String image) {
        this.code = image;
    }
}
