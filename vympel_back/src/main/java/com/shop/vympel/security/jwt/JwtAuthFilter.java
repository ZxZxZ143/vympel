package com.shop.vympel.security.jwt;

import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.logging.RequestCorrelationFilter;
import com.shop.vympel.logging.SecurityAuditLogger;
import com.shop.vympel.security.GlobalErrorHandler;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public JwtAuthFilter(
            JwtService jwtService,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        // Если аутентификация уже есть — не трогаем
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        JwtService.JwtClaims claims;
        try {
            String token = header.substring("Bearer ".length()).trim();
            claims = jwtService.parseAccessToken(token);
        } catch (ExpiredJwtException ex) {
            SecurityContextHolder.clearContext();
            SecurityAuditLogger.jwtRejected("expired");
            GlobalErrorHandler.writeSecurityError(
                    response,
                    request,
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_TOKEN",
                    "Invalid or expired access token."
            );
            return;
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            SecurityAuditLogger.jwtRejected("invalid");
            GlobalErrorHandler.writeSecurityError(
                    response,
                    request,
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_TOKEN",
                    "Invalid or expired access token."
            );
            return;
        }

        Long userId = parseUserId(claims.subject());
        if (userId == null) {
            SecurityAuditLogger.jwtRejected("invalid_subject");
            GlobalErrorHandler.writeSecurityError(
                    response,
                    request,
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_TOKEN",
                    "Invalid or expired access token."
            );
            return;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getEnabled())) {
            SecurityAuditLogger.jwtRejected("user_unavailable");
            GlobalErrorHandler.writeSecurityError(
                    response,
                    request,
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_TOKEN",
                    "Invalid or expired access token."
            );
            return;
        }

        List<String> roles = userRoleRepository.findByUserId(userId).stream()
                .map(userRole -> userRole.getRole().getCode())
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .distinct()
                .toList();

        var authorities = roles.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .toList();

        var authentication = new UsernamePasswordAuthenticationToken(
                claims.subject(),
                null,
                authorities
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.setAttribute(RequestCorrelationFilter.USER_ID_ATTRIBUTE, userId);
        request.setAttribute(RequestCorrelationFilter.ROLES_ATTRIBUTE, String.join(",", roles));
        MDC.put("userId", String.valueOf(userId));
        MDC.put("roles", String.join(",", roles));
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("userId");
            MDC.remove("roles");
        }
    }

    private Long parseUserId(String principal) {
        try {
            return principal == null ? null : Long.parseLong(principal);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
