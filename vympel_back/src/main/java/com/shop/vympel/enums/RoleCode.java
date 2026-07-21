package com.shop.vympel.enums;

import lombok.Getter;

@Getter
public enum RoleCode {
    CUSTOMER(2),
    ADMIN(1),
    MANAGER(3);

    private final int code;

    RoleCode(int i) {
        this.code = i;
    }

}

