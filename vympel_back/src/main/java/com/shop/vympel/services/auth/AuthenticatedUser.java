package com.shop.vympel.services.auth;

import java.util.List;

public record AuthenticatedUser(Long userId, List<String> roles) {
    public AuthenticatedUser {
        roles = roles == null ? List.of() : List.copyOf(roles);
    }
}
