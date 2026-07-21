package com.shop.vympel.security;

import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.logging.RequestCorrelationFilter;
import com.shop.vympel.security.jwt.JwtAuthFilter;
import com.shop.vympel.security.jwt.JwtProperties;
import com.shop.vympel.security.jwt.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public JwtService jwtService(JwtProperties props) {
        return new JwtService(
                props.getSecret(),
                props.getAccessTtlMin(),
                props.getRefreshTtlDays(),
                props.getIssuer(),
                props.getAudience(),
                props.getClockSkewSeconds()
        );
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter(
            JwtService jwtService,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository
    ) {
        return new JwtAuthFilter(jwtService, userRepository, userRoleRepository);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(GlobalErrorHandler.authenticationEntryPoint())
                        .accessDeniedHandler(GlobalErrorHandler.accessDeniedHandlerAs403())
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/health/liveness",
                                "/actuator/health/readiness",
                                "/api/public/**",
                                "/api/auth/**",
                                "/api/crm/auth/login",
                                "/api/crm/auth/refresh",
                                "/api/crm/auth/logout"
                        ).permitAll()

                        .requestMatchers("/api/customer/**").hasAnyRole("CUSTOMER", "ADMIN")

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .requestMatchers("/api/crm/users", "/api/crm/users/**").hasRole("ADMIN")

                        .requestMatchers("/api/crm/cms", "/api/crm/cms/**").hasRole("ADMIN")

                        .requestMatchers("/api/crm/**").hasAnyRole("ADMIN", "MANAGER")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(parseAllowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of(RequestCorrelationFilter.REQUEST_ID_HEADER, "Retry-After"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private List<String> parseAllowedOrigins() {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();

        if (origins.isEmpty() || origins.contains("*")) {
            throw new IllegalStateException("Credentialed CORS requires an explicit non-empty origin allow-list");
        }
        return origins;
    }
}
