package com.shop.vympel.controllers;

import com.shop.vympel.dtos.auth.AuthResponse;
import com.shop.vympel.dtos.auth.LoginByEmailRequest;
import com.shop.vympel.dtos.auth.RegisterByEmailRequest;
import com.shop.vympel.services.auth.AuthServiceImpl;
import com.shop.vympel.security.ratelimit.AbuseProtectionService;
import com.shop.vympel.security.ratelimit.LoginBackoffService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthServiceImpl authServiceImpl;
    private final AbuseProtectionService abuseProtectionService;
    private final LoginBackoffService loginBackoffService;

    @Autowired
    public AuthController(
            AuthServiceImpl authServiceImpl,
            AbuseProtectionService abuseProtectionService,
            LoginBackoffService loginBackoffService
    ) {
        this.authServiceImpl = authServiceImpl;
        this.abuseProtectionService = abuseProtectionService;
        this.loginBackoffService = loginBackoffService;
    }

    @PostMapping("/register/email")
    public ResponseEntity<AuthResponse> register(
            @RequestBody @Valid RegisterByEmailRequest req
    ) throws IllegalArgumentException {
        abuseProtectionService.enforceRegistrationIdentity(req.getEmail());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authServiceImpl.register(req));
    }

    @PostMapping("/login/email")
    public ResponseEntity<AuthResponse> login(
            @RequestBody @Valid LoginByEmailRequest req
    ) throws IllegalArgumentException {
        loginBackoffService.check(req.getEmail());
        try {
            AuthResponse response = authServiceImpl.login(req);
            loginBackoffService.succeeded(req.getEmail());
            return ResponseEntity
                    .status(HttpStatus.ACCEPTED)
                    .body(response);
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            loginBackoffService.failed(req.getEmail());
            throw ex;
        }
    }
}
