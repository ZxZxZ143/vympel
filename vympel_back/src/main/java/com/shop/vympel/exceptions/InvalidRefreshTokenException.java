package com.shop.vympel.exceptions;

import org.springframework.security.authentication.BadCredentialsException;

public class InvalidRefreshTokenException extends BadCredentialsException {
    public InvalidRefreshTokenException() {
        super("Invalid refresh session");
    }
}
