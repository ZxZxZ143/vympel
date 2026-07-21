package com.shop.vympel.controllers;

import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.dtos.auth.AuthResponse;
import com.shop.vympel.dtos.auth.LoginByEmailRequest;
import com.shop.vympel.dtos.crm.CrmUserResponse;
import com.shop.vympel.exceptions.InvalidRefreshTokenException;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.logging.RequestCorrelationFilter;
import com.shop.vympel.security.session.CrmRefreshCookieService;
import com.shop.vympel.security.session.TrustedOriginValidator;
import com.shop.vympel.security.ratelimit.LoginBackoffService;
import com.shop.vympel.services.auth.AuthService;
import com.shop.vympel.services.auth.AuthenticatedUser;
import com.shop.vympel.services.auth.CrmSessionService;
import com.shop.vympel.services.crm.CrmActivityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/auth")
@RequiredArgsConstructor
public class CrmAuthController {
    private final AuthService authService;
    private final CrmSessionService sessionService;
    private final CrmRefreshCookieService refreshCookieService;
    private final TrustedOriginValidator trustedOriginValidator;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final CrmActivityService crmActivityService;
    private final LoginBackoffService loginBackoffService;

    @PostMapping("/login")
    public AuthResponse login(
            @RequestBody @Valid LoginByEmailRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        loginBackoffService.check(req.getEmail());
        AuthenticatedUser authenticatedUser;
        List<String> roles;
        try {
            authenticatedUser = authService.authenticate(req);
            roles = authenticatedUser.roles();
            if (!roles.contains("ADMIN") && !roles.contains("MANAGER")) {
                throw new BadCredentialsException("Invalid email or password");
            }
            loginBackoffService.succeeded(req.getEmail());
        } catch (BadCredentialsException ex) {
            loginBackoffService.failed(req.getEmail());
            throw ex;
        }

        CrmSessionService.SessionTokens session = sessionService.startSession(authenticatedUser);
        refreshCookieService.set(response, session.refreshToken());

        request.setAttribute(RequestCorrelationFilter.USER_ID_ATTRIBUTE, authenticatedUser.userId());
        request.setAttribute(RequestCorrelationFilter.ROLES_ATTRIBUTE, String.join(",", roles));
        Authentication previousAuthentication = SecurityContextHolder.getContext().getAuthentication();
        try {
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(
                            String.valueOf(authenticatedUser.userId()),
                            null,
                            roles.stream()
                                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                                    .map(SimpleGrantedAuthority::new)
                                    .toList()
                    )
            );
            crmActivityService.log(
                    "ADMIN_LOGIN",
                    "USER",
                    authenticatedUser.userId(),
                    Map.of("roles", roles),
                    request
            );
        } finally {
            SecurityContextHolder.getContext().setAuthentication(previousAuthentication);
        }

        return new AuthResponse(session.accessToken());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
            @CookieValue(
                    name = "${security.crm-session.cookie-name:vympel_crm_refresh}",
                    required = false
            ) String refreshToken,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        trustedOriginValidator.validate(request);
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }

        CrmSessionService.SessionTokens session = sessionService.rotate(refreshToken);
        refreshCookieService.set(response, session.refreshToken());
        return new AuthResponse(session.accessToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(
                    name = "${security.crm-session.cookie-name:vympel_crm_refresh}",
                    required = false
            ) String refreshToken,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        trustedOriginValidator.validate(request);
        sessionService.logout(refreshToken);
        refreshCookieService.clear(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public CrmUserResponse me(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new CrmUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getEnabled(),
                userRoleRepository.findByUserId(user.getId())
                        .stream()
                        .map(userRole -> userRole.getRole().getCode())
                        .toList(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
