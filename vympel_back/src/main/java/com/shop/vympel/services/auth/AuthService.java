package com.shop.vympel.services.auth;

import com.shop.vympel.dtos.auth.AuthResponse;
import com.shop.vympel.dtos.auth.LoginByEmailRequest;
import com.shop.vympel.dtos.auth.RegisterByEmailRequest;
import org.springframework.security.authentication.BadCredentialsException;


public interface AuthService {
    AuthResponse register(RegisterByEmailRequest req) throws IllegalArgumentException;

    AuthResponse login(LoginByEmailRequest req) throws BadCredentialsException;

    AuthenticatedUser authenticate(LoginByEmailRequest req) throws BadCredentialsException;
}
