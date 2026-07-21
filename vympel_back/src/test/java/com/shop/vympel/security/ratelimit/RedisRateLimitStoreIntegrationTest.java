package com.shop.vympel.security.ratelimit;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers(disabledWithoutDocker = true)
class RedisRateLimitStoreIntegrationTest {
    @Container
    private static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7.4-alpine"))
            .withExposedPorts(6379);

    private static LettuceConnectionFactory firstConnection;
    private static LettuceConnectionFactory secondConnection;
    private static RedisRateLimitStore firstStore;
    private static RedisRateLimitStore secondStore;

    @BeforeAll
    static void setUpStores() {
        firstConnection = connection();
        secondConnection = connection();
        firstStore = new RedisRateLimitStore(template(firstConnection));
        secondStore = new RedisRateLimitStore(template(secondConnection));
    }

    @AfterAll
    static void closeConnections() {
        if (firstConnection != null) firstConnection.destroy();
        if (secondConnection != null) secondConnection.destroy();
    }

    @Test
    void twoServiceInstancesShareAtomicBurstAndTtlState() throws Exception {
        String key = "vympel:test:shared:" + System.nanoTime();
        var executor = Executors.newFixedThreadPool(12);
        try {
            List<Callable<Boolean>> calls = new ArrayList<>();
            for (int index = 0; index < 40; index++) {
                RateLimitStore store = index % 2 == 0 ? firstStore : secondStore;
                calls.add(() -> store.consume(key, 7, Duration.ofSeconds(30)).allowed());
            }
            long allowed = executor.invokeAll(calls).stream()
                    .filter(future -> {
                        try {
                            return future.get();
                        } catch (Exception ex) {
                            throw new RuntimeException(ex);
                        }
                    })
                    .count();

            assertEquals(7, allowed);
            assertTrue(firstStore.retryAfterSeconds(key) > 0);
            assertTrue(secondStore.retryAfterSeconds(key) <= 30);
        } finally {
            firstStore.reset(key);
            executor.shutdownNow();
        }
    }

    private static LettuceConnectionFactory connection() {
        RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration(
                REDIS.getHost(), REDIS.getMappedPort(6379)
        );
        LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(configuration);
        connectionFactory.afterPropertiesSet();
        connectionFactory.start();
        return connectionFactory;
    }

    private static StringRedisTemplate template(LettuceConnectionFactory connectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate(connectionFactory);
        template.afterPropertiesSet();
        return template;
    }
}
