package com.shop.vympel.security.ratelimit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Component
@ConditionalOnProperty(prefix = "security.rate-limit", name = "storage", havingValue = "redis", matchIfMissing = true)
public class RedisRateLimitStore implements RateLimitStore {
    private static final DefaultRedisScript<List> CONSUME_SCRIPT = new DefaultRedisScript<>("""
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
            local ttl = redis.call('TTL', KEYS[1])
            return {current, ttl}
            """, List.class);

    private static final DefaultRedisScript<Long> BLOCK_SCRIPT = new DefaultRedisScript<>("""
            local ttl = redis.call('TTL', KEYS[1])
            local requested = tonumber(ARGV[1])
            if ttl < requested then
              redis.call('SET', KEYS[1], '1', 'EX', requested)
              return requested
            end
            return ttl
            """, Long.class);

    private final StringRedisTemplate redisTemplate;

    public RedisRateLimitStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public RateLimitDecision consume(String key, long capacity, Duration window) {
        List<?> result = redisTemplate.execute(
                CONSUME_SCRIPT,
                List.of(key),
                String.valueOf(Math.max(1, window.toSeconds()))
        );
        if (result == null || result.size() < 2) {
            throw new RateLimitStoreUnavailableException("Redis rate-limit operation returned no result");
        }
        long count = number(result.get(0));
        long ttl = Math.max(1, number(result.get(1)));
        return new RateLimitDecision(count <= capacity, count, ttl);
    }

    @Override
    public long retryAfterSeconds(String key) {
        Long ttl = redisTemplate.getExpire(key);
        return ttl == null || ttl < 1 ? 0 : ttl;
    }

    @Override
    public void block(String key, Duration duration) {
        redisTemplate.execute(BLOCK_SCRIPT, List.of(key), String.valueOf(Math.max(1, duration.toSeconds())));
    }

    @Override
    public void reset(String key) {
        redisTemplate.delete(key);
    }

    private long number(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }
}
