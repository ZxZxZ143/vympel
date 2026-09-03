package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.exceptions.ProductImportException;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.ConnectException;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Flow;
import java.util.concurrent.Semaphore;
import java.util.function.LongSupplier;

@Component
public class SecureKaspiPageFetcher implements KaspiPageFetcher {
    static final int MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
    private static final int MAX_REDIRECTS = 3;
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(12);

    private final KaspiUrlGuard urlGuard;
    private final HttpClient httpClient;
    private final Semaphore fetchPermits;
    private final LongSupplier nanoTime;

    @Autowired
    public SecureKaspiPageFetcher(
            KaspiUrlGuard urlGuard,
            @Value("${app.kaspi-import.max-concurrent-fetches:4}") int maximumConcurrentFetches
    ) {
        this(urlGuard, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .proxy(new DirectProxySelector())
                .build(), maximumConcurrentFetches, System::nanoTime);
    }

    SecureKaspiPageFetcher(KaspiUrlGuard urlGuard, HttpClient httpClient) {
        this(urlGuard, httpClient, 4, System::nanoTime);
    }

    SecureKaspiPageFetcher(KaspiUrlGuard urlGuard, HttpClient httpClient, int maximumConcurrentFetches) {
        this(urlGuard, httpClient, maximumConcurrentFetches, System::nanoTime);
    }

    SecureKaspiPageFetcher(
            KaspiUrlGuard urlGuard,
            HttpClient httpClient,
            int maximumConcurrentFetches,
            LongSupplier nanoTime
    ) {
        if (maximumConcurrentFetches < 1) {
            throw new IllegalArgumentException("maximumConcurrentFetches must be positive");
        }
        this.urlGuard = urlGuard;
        this.httpClient = httpClient;
        this.fetchPermits = new Semaphore(maximumConcurrentFetches, true);
        this.nanoTime = nanoTime;
    }

    @Override
    public FetchedPage fetch(String sourceUrl) {
        if (!fetchPermits.tryAcquire()) {
            throw failure("KASPI_IMPORT_BUSY", HttpStatus.TOO_MANY_REQUESTS,
                    "Kaspi import capacity is temporarily busy.");
        }
        try {
            return fetchWithPermit(sourceUrl);
        } finally {
            fetchPermits.release();
        }
    }

    private FetchedPage fetchWithPermit(String sourceUrl) {
        long deadline = nanoTime.getAsLong() + REQUEST_TIMEOUT.toNanos();
        URI current = urlGuard.validate(sourceUrl).uri();
        for (int redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
            HttpResponse<byte[]> response = send(current, remainingTimeout(deadline));
            int status = response.statusCode();
            if (isRedirect(status)) {
                if (redirects == MAX_REDIRECTS) {
                    throw failure("KASPI_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                            "Kaspi returned too many redirects.");
                }
                current = validatedRedirect(current, response.headers().firstValue("location"));
                continue;
            }
            if (status != 200) {
                throw upstreamStatus(status);
            }
            validateContentType(response);
            validateContentEncoding(response);
            validateContentLength(response);
            return new FetchedPage(current.toString(), new String(response.body(), StandardCharsets.UTF_8));
        }
        throw failure("KASPI_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY, "Kaspi redirect was rejected.");
    }

    URI validatedRedirect(URI current, Optional<String> location) {
        if (location.isEmpty() || location.get().isBlank()) {
            throw failure("KASPI_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                    "Kaspi returned an invalid redirect.");
        }
        final URI resolved;
        try {
            resolved = current.resolve(location.get().trim());
        } catch (IllegalArgumentException ex) {
            throw failure("KASPI_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                    "Kaspi returned an invalid redirect.");
        }
        try {
            return urlGuard.validate(resolved.toString()).uri();
        } catch (ProductImportException ex) {
            throw new ProductImportException(
                    "KASPI_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                    "Kaspi redirected to an unsupported destination.", ex
            );
        }
    }

    private Duration remainingTimeout(long deadline) {
        long remainingNanos = deadline - nanoTime.getAsLong();
        if (remainingNanos <= 0) {
            throw failure("KASPI_FETCH_TIMEOUT", HttpStatus.GATEWAY_TIMEOUT,
                    "Kaspi did not respond in time.");
        }
        return Duration.ofNanos(remainingNanos);
    }

    private HttpResponse<byte[]> send(URI uri, Duration timeout) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(timeout)
                .header("Accept", "text/html,application/xhtml+xml")
                .header("Accept-Encoding", "identity")
                .header("User-Agent", "VympelCatalogImporter/1.0")
                .GET()
                .build();
        try {
            return httpClient.send(request, ignored -> new BoundedBodySubscriber(MAX_RESPONSE_BYTES));
        } catch (HttpConnectTimeoutException ex) {
            throw new ProductImportException(
                    "KASPI_FETCH_TIMEOUT", HttpStatus.GATEWAY_TIMEOUT, "Kaspi did not respond in time.", ex
            );
        } catch (java.net.http.HttpTimeoutException ex) {
            throw new ProductImportException(
                    "KASPI_FETCH_TIMEOUT", HttpStatus.GATEWAY_TIMEOUT, "Kaspi did not respond in time.", ex
            );
        } catch (ConnectException ex) {
            throw new ProductImportException(
                    "KASPI_FETCH_FAILED", HttpStatus.BAD_GATEWAY, "Kaspi could not be reached.", ex
            );
        } catch (IOException ex) {
            ProductImportException importFailure = findImportFailure(ex);
            if (importFailure != null) throw importFailure;
            throw new ProductImportException(
                    "KASPI_FETCH_FAILED", HttpStatus.BAD_GATEWAY, "Kaspi could not be fetched.", ex
            );
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ProductImportException(
                    "KASPI_FETCH_FAILED", HttpStatus.SERVICE_UNAVAILABLE, "Kaspi import was interrupted.", ex
            );
        }
    }

    private void validateContentType(HttpResponse<?> response) {
        String contentType = response.headers().firstValue("content-type").orElse("")
                .toLowerCase(Locale.ROOT);
        if (!contentType.startsWith("text/html") && !contentType.startsWith("application/xhtml+xml")) {
            throw failure("KASPI_RESPONSE_INVALID", HttpStatus.BAD_GATEWAY,
                    "Kaspi returned an unsupported response.");
        }
    }

    private void validateContentLength(HttpResponse<?> response) {
        response.headers().firstValueAsLong("content-length").ifPresent(length -> {
            if (length > MAX_RESPONSE_BYTES) {
                throw failure("KASPI_RESPONSE_TOO_LARGE", HttpStatus.BAD_GATEWAY,
                        "Kaspi response is too large.");
            }
        });
    }

    private void validateContentEncoding(HttpResponse<?> response) {
        String contentEncoding = response.headers().firstValue("content-encoding").orElse("")
                .trim()
                .toLowerCase(Locale.ROOT);
        if (!contentEncoding.isEmpty() && !"identity".equals(contentEncoding)) {
            throw failure("KASPI_RESPONSE_INVALID", HttpStatus.BAD_GATEWAY,
                    "Kaspi returned an unsupported response encoding.");
        }
    }

    private ProductImportException upstreamStatus(int status) {
        if (status == 403) {
            return failure("KASPI_FETCH_FORBIDDEN", HttpStatus.BAD_GATEWAY, "Kaspi refused the import request.");
        }
        if (status == 404) {
            return failure("KASPI_PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND, "Kaspi product was not found.");
        }
        if (status == 429) {
            return failure("KASPI_UPSTREAM_RATE_LIMITED", HttpStatus.BAD_GATEWAY,
                    "Kaspi temporarily limited import requests.");
        }
        return failure("KASPI_FETCH_FAILED", HttpStatus.BAD_GATEWAY, "Kaspi returned an unexpected response.");
    }

    private boolean isRedirect(int status) {
        return status == 301 || status == 302 || status == 303 || status == 307 || status == 308;
    }

    private ProductImportException failure(String code, HttpStatus status, String message) {
        return new ProductImportException(code, status, message);
    }

    private ProductImportException findImportFailure(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof ProductImportException importException) return importException;
            current = current.getCause();
        }
        return null;
    }

    static final class BoundedBodySubscriber implements HttpResponse.BodySubscriber<byte[]> {
        private final int maximumBytes;
        private final ByteArrayOutputStream output = new ByteArrayOutputStream();
        private final CompletableFuture<byte[]> body = new CompletableFuture<>();
        private Flow.Subscription subscription;
        private int receivedBytes;

        BoundedBodySubscriber(int maximumBytes) {
            this.maximumBytes = maximumBytes;
        }

        @Override
        public CompletionStage<byte[]> getBody() {
            return body;
        }

        @Override
        public void onSubscribe(Flow.Subscription nextSubscription) {
            if (subscription != null) {
                nextSubscription.cancel();
                return;
            }
            subscription = nextSubscription;
            nextSubscription.request(Long.MAX_VALUE);
        }

        @Override
        public void onNext(List<ByteBuffer> buffers) {
            if (body.isDone()) return;
            for (ByteBuffer buffer : buffers) {
                int chunkBytes = buffer.remaining();
                if (chunkBytes > maximumBytes - receivedBytes) {
                    subscription.cancel();
                    body.completeExceptionally(new ProductImportException(
                            "KASPI_RESPONSE_TOO_LARGE",
                            HttpStatus.BAD_GATEWAY,
                            "Kaspi response is too large."
                    ));
                    return;
                }
                byte[] chunk = new byte[chunkBytes];
                buffer.get(chunk);
                output.writeBytes(chunk);
                receivedBytes += chunkBytes;
            }
        }

        @Override
        public void onError(Throwable error) {
            body.completeExceptionally(error);
        }

        @Override
        public void onComplete() {
            body.complete(output.toByteArray());
        }
    }

    private static final class DirectProxySelector extends ProxySelector {
        @Override
        public List<Proxy> select(URI uri) {
            return List.of(Proxy.NO_PROXY);
        }

        @Override
        public void connectFailed(URI uri, SocketAddress sa, IOException ioe) {
            // No proxy is used, so there is no proxy failure to report.
        }
    }
}
