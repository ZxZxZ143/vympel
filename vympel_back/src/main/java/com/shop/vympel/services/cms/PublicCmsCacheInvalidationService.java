package com.shop.vympel.services.cms;

import com.shop.vympel.dtos.cms.CmsPublicCacheRefreshResponse;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Service
@Slf4j
public class PublicCmsCacheInvalidationService {
    private static final String SIGNATURE_VERSION = "1";

    private final CmsRevalidationOutboxService outboxService;
    private final CmsRevalidationJobStore jobStore;
    private final String revalidateUrl;
    private final String revalidateSecret;
    private final Duration timeout;
    private final int maxAttempts;
    private final MeterRegistry meterRegistry;

    @Autowired
    public PublicCmsCacheInvalidationService(
            CmsRevalidationOutboxService outboxService,
            CmsRevalidationJobStore jobStore,
            @Value("${app.cms.public-revalidate.url:}") String revalidateUrl,
            @Value("${app.cms.public-revalidate.secret:}") String revalidateSecret,
            @Value("${app.cms.public-revalidate.timeout-ms:3000}") int timeoutMs,
            @Value("${app.cms.public-revalidate.max-attempts:8}") int maxAttempts,
            MeterRegistry meterRegistry
    ) {
        this.outboxService = outboxService;
        this.jobStore = jobStore;
        this.revalidateUrl = revalidateUrl;
        this.revalidateSecret = revalidateSecret;
        this.timeout = Duration.ofMillis(Math.max(250, timeoutMs));
        this.maxAttempts = Math.max(1, maxAttempts);
        this.meterRegistry = meterRegistry;
    }

    PublicCmsCacheInvalidationService(
            CmsRevalidationOutboxService outboxService,
            CmsRevalidationJobStore jobStore,
            String revalidateUrl,
            String revalidateSecret,
            int timeoutMs,
            int maxAttempts
    ) {
        this(outboxService, jobStore, revalidateUrl, revalidateSecret, timeoutMs, maxAttempts,
                new SimpleMeterRegistry());
    }

    public CmsPublicCacheRefreshResponse refreshPage(String pageKey) {
        if (!outboxService.isEnabled()) {
            recordOutcome("disabled");
            return CmsPublicCacheRefreshResponse.notRequired();
        }

        Instant now = Instant.now();
        CmsRevalidationJobStore.Claim claim = jobStore.claim(pageKey, now).orElse(null);
        if (claim == null) {
            recordOutcome("already_pending");
            return CmsPublicCacheRefreshResponse.retryScheduled(null, "ALREADY_PENDING");
        }
        if (isBlank(revalidateUrl) || isBlank(revalidateSecret)) {
            jobStore.completePermanent(claim, now, "NOT_CONFIGURED");
            log.error("Public CMS cache revalidation is enabled but not configured pageKey={}", pageKey);
            recordOutcome("not_configured");
            return CmsPublicCacheRefreshResponse.notConfigured(claim.requestId());
        }

        long startedNanos = System.nanoTime();
        try {
            long timestamp = now.getEpochSecond();
            String body = requestBody(claim, timestamp);
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(timeout)
                    .followRedirects(HttpClient.Redirect.NEVER)
                    .version(HttpClient.Version.HTTP_1_1)
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(revalidateUrl))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("X-CMS-Signature", signature(claim, timestamp))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            int status = response.statusCode();
            if (status >= 200 && status < 300) {
                jobStore.completeSuccess(claim, Instant.now());
                log.info(
                        "Public CMS cache revalidated pageKey={} requestId={} attempt={} latencyMs={}",
                        pageKey,
                        claim.requestId(),
                        claim.attemptCount(),
                        elapsedMillis(startedNanos)
                );
                recordOutcome("success");
                recordLatency(startedNanos, "success");
                return CmsPublicCacheRefreshResponse.success(claim.requestId());
            }
            if (status >= 400 && status < 500) {
                jobStore.completePermanent(claim, Instant.now(), "HTTP_" + status);
                log.error(
                        "Public CMS cache revalidation permanently rejected pageKey={} requestId={} status={} latencyMs={}",
                        pageKey,
                        claim.requestId(),
                        status,
                        elapsedMillis(startedNanos)
                );
                recordOutcome("permanent_failure");
                recordLatency(startedNanos, "permanent_failure");
                return CmsPublicCacheRefreshResponse.permanentFailure(claim.requestId(), "HTTP_" + status);
            }
            return scheduleRetry(claim, "HTTP_" + status, startedNanos);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return scheduleRetry(claim, "REQUEST_INTERRUPTED", startedNanos);
        } catch (Exception ex) {
            log.warn(
                    "Public CMS cache revalidation request failed pageKey={} exceptionType={} message={}",
                    pageKey,
                    ex.getClass().getSimpleName(),
                    ex.getMessage()
            );
            return scheduleRetry(claim, "REQUEST_FAILED", startedNanos);
        }
    }

    private CmsPublicCacheRefreshResponse scheduleRetry(
            CmsRevalidationJobStore.Claim claim,
            String errorCode,
            long startedNanos
    ) {
        if (claim.attemptCount() >= maxAttempts) {
            jobStore.completePermanent(claim, Instant.now(), "RETRY_EXHAUSTED");
            log.error(
                    "Public CMS cache revalidation retries exhausted pageKey={} requestId={} attempts={} latencyMs={}",
                    claim.pageKey(),
                    claim.requestId(),
                    claim.attemptCount(),
                    elapsedMillis(startedNanos)
            );
            recordOutcome("retry_exhausted");
            recordLatency(startedNanos, "retry_exhausted");
            return CmsPublicCacheRefreshResponse.permanentFailure(claim.requestId(), "RETRY_EXHAUSTED");
        }
        jobStore.completeRetry(claim, Instant.now(), errorCode);
        log.warn(
                "Public CMS cache revalidation retry scheduled pageKey={} requestId={} attempt={} errorCode={} latencyMs={}",
                claim.pageKey(),
                claim.requestId(),
                claim.attemptCount(),
                errorCode,
                elapsedMillis(startedNanos)
        );
        recordOutcome("retry_scheduled");
        recordLatency(startedNanos, "retry_scheduled");
        return CmsPublicCacheRefreshResponse.retryScheduled(claim.requestId(), errorCode);
    }

    private String requestBody(CmsRevalidationJobStore.Claim claim, long timestamp) {
        return "{\"version\":\"" + SIGNATURE_VERSION
                + "\",\"timestamp\":" + timestamp
                + ",\"requestId\":\"" + claim.requestId()
                + "\",\"pageKey\":\"" + claim.pageKey() + "\"}";
    }

    private String signature(CmsRevalidationJobStore.Claim claim, long timestamp) throws Exception {
        String canonical = SIGNATURE_VERSION + "\n" + timestamp + "\n" + claim.requestId() + "\n" + claim.pageKey();
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(revalidateSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8)));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private long elapsedMillis(long startedNanos) {
        return Duration.ofNanos(System.nanoTime() - startedNanos).toMillis();
    }

    private void recordOutcome(String outcome) {
        meterRegistry.counter("cms_revalidation_attempts_total", "outcome", outcome).increment();
    }

    private void recordLatency(long startedNanos, String outcome) {
        Timer.builder("cms_revalidation_latency")
                .tag("outcome", outcome)
                .register(meterRegistry)
                .record(Duration.ofNanos(System.nanoTime() - startedNanos));
    }
}
