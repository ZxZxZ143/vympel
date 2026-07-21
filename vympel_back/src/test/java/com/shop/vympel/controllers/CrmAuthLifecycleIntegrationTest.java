package com.shop.vympel.controllers;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.shop.vympel.db.entity.auth.Role;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.entity.auth.UserRole;
import com.shop.vympel.db.entity.analytics.ProductAnalyticsEvent;
import com.shop.vympel.db.repositories.user.RoleRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.db.repositories.analytics.ProductAnalyticsEventRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.services.product.ProductAnalyticsRetentionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CrmAuthLifecycleIntegrationTest {
    private static final String PASSWORD = "Step3-integration-password-42";
    private static final String TRUSTED_ORIGIN = "http://localhost:3001";

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserRoleRepository userRoleRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ProductAnalyticsEventRepository analyticsEventRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductAnalyticsRetentionService analyticsRetentionService;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final List<Long> analyticsEventIds = new ArrayList<>();
    private User admin;
    private User manager;

    @BeforeEach
    void createTestUsers() {
        String suffix = UUID.randomUUID().toString();
        admin = createUser("step3-admin-" + suffix + "@vympel.test", "ADMIN");
        manager = createUser("step3-manager-" + suffix + "@vympel.test", "MANAGER");
    }

    @AfterEach
    void deleteTestUsers() {
        if (!analyticsEventIds.isEmpty()) {
            analyticsEventRepository.deleteAllById(analyticsEventIds);
            analyticsEventRepository.flush();
            assertThat(analyticsEventRepository.findAll().stream().map(event -> event.getId()))
                    .doesNotContainAnyElementsOf(analyticsEventIds);
            analyticsEventIds.clear();
        }
        if (manager != null && userRepository.existsById(manager.getId())) {
            userRepository.deleteById(manager.getId());
        }
        if (admin != null && userRepository.existsById(admin.getId())) {
            userRepository.deleteById(admin.getId());
        }
    }

    @Test
    void loginRefreshReplayLogoutAndForbiddenFlowsAreFinite() throws Exception {
        assertThat(unauthenticatedGet("/api/crm/auth/me").statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());

        HttpResponse<String> adminLogin = login(admin.getEmail());
        assertThat(adminLogin.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(adminLogin.headers().firstValue(HttpHeaders.SET_COOKIE)).isPresent();
        JsonNode loginBody = objectMapper.readTree(adminLogin.body());
        assertThat(loginBody.path("accessToken").asString()).isNotBlank();
        assertThat(loginBody.has("refreshToken")).isFalse();
        String originalCookie = cookiePair(adminLogin);

        HttpResponse<String> initialMe = get("/api/crm/auth/me", accessToken(adminLogin));
        assertThat(initialMe.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(objectMapper.readTree(initialMe.body()).path("roles").toString()).contains("ADMIN");

        HttpResponse<String> rotated = cookiePost("/api/crm/auth/refresh", originalCookie);
        assertThat(rotated.statusCode()).isEqualTo(HttpStatus.OK.value());
        String rotatedCookie = cookiePair(rotated);
        assertThat(rotatedCookie).isNotEqualTo(originalCookie);
        assertThat(get("/api/crm/auth/me", accessToken(rotated)).statusCode())
                .isEqualTo(HttpStatus.OK.value());

        HttpResponse<String> replay = cookiePost("/api/crm/auth/refresh", originalCookie);
        assertThat(replay.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(objectMapper.readTree(replay.body()).path("code").asString()).isEqualTo("INVALID_SESSION");
        assertThat(cookiePost("/api/crm/auth/refresh", rotatedCookie).statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());

        HttpResponse<String> managerLogin = login(manager.getEmail());
        String managerAccess = accessToken(managerLogin);
        String managerCookie = cookiePair(managerLogin);
        String adminControlAccess = accessToken(login(admin.getEmail()));
        assertThat(get("/api/crm/users?page=0&size=1", managerAccess).statusCode())
                .isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(get("/api/crm/auth/me", managerAccess).statusCode())
                .isEqualTo(HttpStatus.OK.value());

        HttpResponse<String> managerRefreshAfterForbidden = cookiePost("/api/crm/auth/refresh", managerCookie);
        assertThat(managerRefreshAfterForbidden.statusCode()).isEqualTo(HttpStatus.OK.value());
        managerCookie = cookiePair(managerRefreshAfterForbidden);

        HttpResponse<String> roleChange = patchJson(
                "/api/crm/users/" + manager.getId() + "/roles",
                adminControlAccess,
                "{\"roles\":[\"ADMIN\"]}"
        );
        assertThat(roleChange.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(get("/api/crm/users?page=0&size=1", managerAccess).statusCode())
                .isEqualTo(HttpStatus.OK.value());
        assertThat(cookiePost("/api/crm/auth/refresh", managerCookie).statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());

        HttpResponse<String> promotedLogin = login(manager.getEmail());
        String promotedCookie = cookiePair(promotedLogin);
        HttpResponse<String> disable = patchJson(
                "/api/crm/users/" + manager.getId() + "/status",
                adminControlAccess,
                "{\"enabled\":false}"
        );
        assertThat(disable.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(cookiePost("/api/crm/auth/refresh", promotedCookie).statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());

        HttpResponse<String> logoutLogin = login(admin.getEmail());
        String logoutCookie = cookiePair(logoutLogin);
        HttpResponse<String> logout = cookiePost("/api/crm/auth/logout", logoutCookie);
        assertThat(logout.statusCode()).isEqualTo(HttpStatus.NO_CONTENT.value());
        assertThat(logout.headers().firstValue(HttpHeaders.SET_COOKIE).orElseThrow())
                .contains("Max-Age=0");
        assertThat(cookiePost("/api/crm/auth/refresh", logoutCookie).statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());

        assertThat(cookiePost("/api/crm/auth/logout", "").statusCode())
                .isEqualTo(HttpStatus.NO_CONTENT.value());
    }

    @Test
    void concurrentRefreshRequestsCannotBothSucceed() throws Exception {
        String cookie = cookiePair(login(admin.getEmail()));

        CompletableFuture<HttpResponse<String>> first = CompletableFuture.supplyAsync(
                () -> cookiePostUnchecked("/api/crm/auth/refresh", cookie)
        );
        CompletableFuture<HttpResponse<String>> second = CompletableFuture.supplyAsync(
                () -> cookiePostUnchecked("/api/crm/auth/refresh", cookie)
        );
        List<HttpResponse<String>> responses = CompletableFuture.allOf(first, second)
                .thenApply(ignored -> List.of(first.join(), second.join()))
                .join();

        assertThat(responses.stream().map(HttpResponse::statusCode).sorted().toList())
                .containsExactly(HttpStatus.OK.value(), HttpStatus.UNAUTHORIZED.value());

        HttpResponse<String> successfulRotation = responses.stream()
                .filter(response -> response.statusCode() == HttpStatus.OK.value())
                .findFirst()
                .orElseThrow();
        assertThat(cookiePost("/api/crm/auth/refresh", cookiePair(successfulRotation)).statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    void invalidUnknownAndBlockedLoginsShareOneSafeUnauthorizedContract() throws Exception {
        User customer = createUser("step4-customer-" + UUID.randomUUID() + "@vympel.test", "CUSTOMER");
        try {
            HttpResponse<String> invalidPassword = login(admin.getEmail(), "wrong-password");
            HttpResponse<String> unknownUser = login("missing-" + UUID.randomUUID() + "@vympel.test", PASSWORD);
            manager.setEnabled(false);
            userRepository.saveAndFlush(manager);
            HttpResponse<String> blockedUser = login(manager.getEmail(), PASSWORD);
            HttpResponse<String> nonCrmUser = login(customer.getEmail(), PASSWORD);

            assertThat(List.of(invalidPassword, unknownUser, blockedUser, nonCrmUser))
                    .allSatisfy(response -> {
                        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
                        assertThat(response.body())
                                .doesNotContain(
                                        admin.getEmail(), manager.getEmail(), customer.getEmail(),
                                        "password", "exception", "stack"
                                );
                    });
            assertThat(List.of(invalidPassword, unknownUser, blockedUser, nonCrmUser).stream()
                    .map(response -> readJsonUnchecked(response.body()).path("message").asString())
                    .distinct()
                    .toList())
                    .containsExactly("Invalid credentials.");
        } finally {
            if (userRepository.existsById(customer.getId())) {
                userRepository.deleteById(customer.getId());
            }
        }
    }

    @Test
    void repeatedInvalidLoginReachesBounded429BackoffContract() throws Exception {
        String missingEmail = "backoff-" + UUID.randomUUID() + "@vympel.test";

        assertThat(login(missingEmail, "wrong-password").statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(login(missingEmail, "wrong-password").statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());
        HttpResponse<String> throttled = login(missingEmail, "wrong-password");

        assertThat(throttled.statusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(throttled.headers().firstValue("Retry-After")).isPresent();
        assertThat(Integer.parseInt(throttled.headers().firstValue("Retry-After").orElseThrow())).isPositive();
        assertThat(throttled.headers().firstValue("X-Request-Id")).isPresent();
        assertThat(throttled.body())
                .contains("RATE_LIMIT_EXCEEDED", "retryAfterSeconds", "requestId")
                .doesNotContain(missingEmail, "wrong-password", "login-account-backoff");
    }

    @Test
    void duplicateAnalyticsEventIsAcknowledgedWithoutSecondPersistence() throws Exception {
        Long productId = productRepository.findAll().stream().findFirst().orElseThrow().getId();
        String sessionId = "step4-analytics-" + UUID.randomUUID();
        String body = objectMapper.writeValueAsString(Map.of(
                "productId", productId,
                "eventType", "VIEW",
                "sessionId", sessionId
        ));
        long eventCountBefore = analyticsEventRepository.count();

        HttpResponse<String> first = postJson("/api/public/analytics/products/events", body);
        assertThat(first.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(objectMapper.readTree(first.body()).path("tracked").asBoolean()).isTrue();
        List<Long> createdEventIds = analyticsEventRepository.findAll().stream()
                .filter(event -> productId.equals(event.getProduct().getId()))
                .filter(event -> "VIEW".equals(event.getEventType()))
                .map(event -> event.getId())
                .sorted()
                .toList();
        assertThat(analyticsEventRepository.count()).isEqualTo(eventCountBefore + 1);
        Long createdEventId = createdEventIds.get(createdEventIds.size() - 1);
        analyticsEventIds.add(createdEventId);

        HttpResponse<String> duplicate = postJson("/api/public/analytics/products/events", body);
        assertThat(duplicate.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(objectMapper.readTree(duplicate.body()).path("tracked").asBoolean()).isFalse();
        assertThat(analyticsEventRepository.count()).isEqualTo(eventCountBefore + 1);
    }

    @Test
    void onlyMinimalHealthProbesArePublic() throws Exception {
        HttpResponse<String> liveness = unauthenticatedGet("/actuator/health/liveness");
        HttpResponse<String> readiness = unauthenticatedGet("/actuator/health/readiness");

        assertThat(liveness.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(readiness.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(liveness.body()).contains("\"status\":\"UP\"").doesNotContain("components", "details");
        assertThat(readiness.body()).contains("\"status\":\"UP\"").doesNotContain("components", "details");
        assertThat(unauthenticatedGet("/actuator/health").statusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    void analyticsRetentionDeletesExpiredEventsAndPreservesCurrentEvents() {
        var product = productRepository.findAll().stream().findFirst().orElseThrow();
        ProductAnalyticsEvent expired = new ProductAnalyticsEvent();
        expired.setProduct(product);
        expired.setEventType("VIEW");
        expired.setCreatedAt(Instant.now().minus(181, ChronoUnit.DAYS));
        ProductAnalyticsEvent current = new ProductAnalyticsEvent();
        current.setProduct(product);
        current.setEventType("VIEW");
        current.setCreatedAt(Instant.now().minus(179, ChronoUnit.DAYS));
        expired = analyticsEventRepository.saveAndFlush(expired);
        current = analyticsEventRepository.saveAndFlush(current);
        analyticsEventIds.add(expired.getId());
        analyticsEventIds.add(current.getId());

        ProductAnalyticsRetentionService.RetentionResult result = analyticsRetentionService.runOnce();

        assertThat(result.lockAcquired()).isTrue();
        assertThat(analyticsEventRepository.existsById(expired.getId())).isFalse();
        assertThat(analyticsEventRepository.existsById(current.getId())).isTrue();
    }

    @Test
    void catalogSortContractDefaultsAndRejectsUnsupportedCaseSensitiveValues() throws Exception {
        assertThat(unauthenticatedGet("/api/public/product/catalog/ru?page=0&size=1").statusCode())
                .isEqualTo(HttpStatus.OK.value());
        assertThat(unauthenticatedGet("/api/public/product/catalog/ru?page=0&size=1&sort=").statusCode())
                .isEqualTo(HttpStatus.OK.value());

        HttpResponse<String> invalid = unauthenticatedGet(
                "/api/public/product/catalog/ru?page=0&size=1&sort=PriceAsc"
        );
        assertThat(invalid.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(invalid.body()).contains("INVALID_SORT", "requestId");
    }

    @Test
    void deletedUserCannotRefresh() throws Exception {
        String cookie = cookiePair(login(manager.getEmail()));
        userRepository.deleteById(manager.getId());
        userRepository.flush();

        HttpResponse<String> response = cookiePost("/api/crm/auth/refresh", cookie);

        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(readJsonUnchecked(response.body()).path("code").asString()).isEqualTo("INVALID_SESSION");
    }

    @Test
    void refreshAndLogoutRejectUntrustedOrigins() throws Exception {
        String cookie = cookiePair(login(admin.getEmail()));
        HttpRequest refresh = HttpRequest.newBuilder(uri("/api/crm/auth/refresh"))
                .header("Origin", "https://evil.test")
                .header("Cookie", cookie)
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> response = httpClient.send(refresh, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(response.body()).doesNotContain("token", "exception", "stack");
    }

    private User createUser(String email, String roleCode) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        user.setEnabled(true);
        User saved = userRepository.save(user);
        Role role = roleRepository.findByCodeAndActiveTrue(roleCode).orElseThrow();
        userRoleRepository.save(UserRole.of(saved, role));
        return saved;
    }

    private HttpResponse<String> login(String email) throws Exception {
        return login(email, PASSWORD);
    }

    private HttpResponse<String> login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginRequest(email, password));
        HttpRequest request = HttpRequest.newBuilder(uri("/api/crm/auth/login"))
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path, String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .GET()
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> unauthenticatedGet(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path)).GET().build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> patchJson(String path, String accessToken, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> postJson(String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> cookiePost(String path, String cookie) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri(path))
                .header("Origin", TRUSTED_ORIGIN)
                .POST(HttpRequest.BodyPublishers.noBody());
        if (cookie != null && !cookie.isBlank()) {
            builder.header("Cookie", cookie);
        }
        return httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> cookiePostUnchecked(String path, String cookie) {
        try {
            return cookiePost(path, cookie);
        } catch (Exception ex) {
            throw new CompletionException(ex);
        }
    }

    private String accessToken(HttpResponse<String> response) throws Exception {
        return objectMapper.readTree(response.body()).path("accessToken").asString();
    }

    private String cookiePair(HttpResponse<String> response) {
        return response.headers()
                .firstValue(HttpHeaders.SET_COOKIE)
                .orElseThrow()
                .split(";", 2)[0];
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private JsonNode readJsonUnchecked(String body) {
        try {
            return objectMapper.readTree(body);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Expected JSON response", ex);
        }
    }

    private record LoginRequest(String email, String password) {
    }
}
