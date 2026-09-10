package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.exceptions.ProductImportException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.ConnectException;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Flow;
import java.util.concurrent.Semaphore;
import java.util.function.LongSupplier;

@Component
public class SecureWildberriesProductFetcher implements WildberriesProductFetcher {
    static final int MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
    private static final int MAX_REDIRECTS = 3;
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(12);
    private static final String DETAILS_HOST = "alm-basket-cdn-04.geobasket.net";

    private final WildberriesUrlGuard urlGuard;
    private final HttpClient httpClient;
    private final Semaphore fetchPermits;
    private final String destination;
    private final LongSupplier nanoTime;

    @Autowired
    public SecureWildberriesProductFetcher(
            WildberriesUrlGuard urlGuard,
            @Value("${app.wildberries-import.max-concurrent-fetches:4}") int maximumConcurrentFetches,
            @Value("${app.wildberries-import.destination:82}") String destination
    ) {
        this(urlGuard, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .proxy(new DirectProxySelector())
                .build(), maximumConcurrentFetches, destination, System::nanoTime);
    }

    SecureWildberriesProductFetcher(WildberriesUrlGuard urlGuard, HttpClient httpClient) {
        this(urlGuard, httpClient, 4, "82", System::nanoTime);
    }

    SecureWildberriesProductFetcher(
            WildberriesUrlGuard urlGuard,
            HttpClient httpClient,
            int maximumConcurrentFetches,
            String destination,
            LongSupplier nanoTime
    ) {
        if (maximumConcurrentFetches < 1) throw new IllegalArgumentException("maximumConcurrentFetches must be positive");
        if (destination == null || !destination.matches("[1-9]\\d{0,9}")) {
            throw new IllegalArgumentException("destination must be a positive Wildberries destination identifier");
        }
        this.urlGuard = urlGuard;
        this.httpClient = httpClient;
        this.fetchPermits = new Semaphore(maximumConcurrentFetches, true);
        this.destination = destination;
        this.nanoTime = nanoTime;
    }

    @Override
    public FetchedProduct fetch(String sourceUrl) {
        if (!fetchPermits.tryAcquire()) {
            throw failure("WILDBERRIES_IMPORT_BUSY", HttpStatus.TOO_MANY_REQUESTS,
                    "Wildberries import capacity is temporarily busy.");
        }
        try {
            return fetchWithPermit(sourceUrl);
        } finally {
            fetchPermits.release();
        }
    }

    private FetchedProduct fetchWithPermit(String sourceUrl) {
        long deadline = nanoTime.getAsLong() + REQUEST_TIMEOUT.toNanos();
        WildberriesUrlGuard.ValidatedProduct product = urlGuard.validateProductUrl(sourceUrl);
        long productId = product.productId();
        URI catalogUri = URI.create("https://card.wb.ru/cards/v4/detail?appType=1&curr=kzt&dest="
                + destination + "&spp=30&nm=" + productId);
        urlGuard.validateCatalogApi(catalogUri, productId, destination);
        byte[] catalog = fetchJson(catalogUri, deadline, productId, true, MAX_RESPONSE_BYTES);

        URI detailsUri = URI.create("https://" + DETAILS_HOST + WildberriesUrlGuard.detailsPath(productId));
        urlGuard.validateDetailsUri(detailsUri, productId);
        int remainingBytes = MAX_RESPONSE_BYTES - catalog.length;
        if (remainingBytes <= 0) {
            throw failure("WILDBERRIES_RESPONSE_TOO_LARGE", HttpStatus.BAD_GATEWAY,
                    "Wildberries response is too large.");
        }
        byte[] details = fetchJson(detailsUri, deadline, productId, false, remainingBytes);
        return new FetchedProduct(
                product.canonicalUrl().toString(), productId,
                new String(catalog, StandardCharsets.UTF_8),
                new String(details, StandardCharsets.UTF_8)
        );
    }

    private byte[] fetchJson(URI initial, long deadline, long productId, boolean catalog, int maximumBytes) {
        URI current = initial;
        for (int redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
            HttpResponse<byte[]> response = send(current, remainingTimeout(deadline), maximumBytes);
            int status = response.statusCode();
            if (isRedirect(status)) {
                if (redirects == MAX_REDIRECTS) {
                    throw failure("WILDBERRIES_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                            "Wildberries returned too many redirects.");
                }
                String location = response.headers().firstValue("location").orElse(null);
                current = catalog
                        ? validateCatalogRedirect(current, location, productId)
                        : urlGuard.resolveDetailsRedirect(current, location, productId);
                continue;
            }
            if (status != 200) throw upstreamStatus(status);
            validateContentType(response);
            validateContentEncoding(response);
            validateContentLength(response, maximumBytes);
            return response.body();
        }
        throw failure("WILDBERRIES_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                "Wildberries redirect was rejected.");
    }

    private URI validateCatalogRedirect(URI current, String location, long productId) {
        if (location == null || location.isBlank()) {
            throw failure("WILDBERRIES_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                    "Wildberries returned an invalid redirect.");
        }
        try {
            return urlGuard.validateCatalogApi(current.resolve(location.trim()), productId, destination);
        } catch (IllegalArgumentException | ProductImportException ex) {
            throw new ProductImportException(
                    "WILDBERRIES_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                    "Wildberries redirected to an unsupported destination.", ex
            );
        }
    }

    private Duration remainingTimeout(long deadline) {
        long remainingNanos = deadline - nanoTime.getAsLong();
        if (remainingNanos <= 0) {
            throw failure("WILDBERRIES_FETCH_TIMEOUT", HttpStatus.GATEWAY_TIMEOUT,
                    "Wildberries did not respond in time.");
        }
        return Duration.ofNanos(remainingNanos);
    }

    private HttpResponse<byte[]> send(URI uri, Duration timeout, int maximumBytes) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(timeout)
                .header("Accept", "application/json")
                .header("Accept-Encoding", "identity")
                .header("User-Agent", "VympelCatalogImporter/1.0")
                .GET()
                .build();
        try {
            return httpClient.send(request, ignored -> new BoundedBodySubscriber(maximumBytes));
        } catch (java.net.http.HttpTimeoutException ex) {
            throw new ProductImportException(
                    "WILDBERRIES_FETCH_TIMEOUT", HttpStatus.GATEWAY_TIMEOUT,
                    "Wildberries did not respond in time.", ex
            );
        } catch (ConnectException ex) {
            throw new ProductImportException(
                    "WILDBERRIES_FETCH_FAILED", HttpStatus.BAD_GATEWAY,
                    "Wildberries could not be reached.", ex
            );
        } catch (IOException ex) {
            ProductImportException importFailure = findImportFailure(ex);
            if (importFailure != null) throw importFailure;
            throw new ProductImportException(
                    "WILDBERRIES_FETCH_FAILED", HttpStatus.BAD_GATEWAY,
                    "Wildberries could not be fetched.", ex
            );
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ProductImportException(
                    "WILDBERRIES_FETCH_FAILED", HttpStatus.SERVICE_UNAVAILABLE,
                    "Wildberries import was interrupted.", ex
            );
        }
    }

    private void validateContentType(HttpResponse<?> response) {
        String contentType = response.headers().firstValue("content-type").orElse("")
                .toLowerCase(Locale.ROOT);
        if (!contentType.startsWith("application/json") && !contentType.startsWith("text/json")) {
            throw failure("WILDBERRIES_RESPONSE_INVALID", HttpStatus.BAD_GATEWAY,
                    "Wildberries returned an unsupported response.");
        }
    }

    private void validateContentEncoding(HttpResponse<?> response) {
        String encoding = response.headers().firstValue("content-encoding").orElse("")
                .trim().toLowerCase(Locale.ROOT);
        if (!encoding.isEmpty() && !"identity".equals(encoding)) {
            throw failure("WILDBERRIES_RESPONSE_INVALID", HttpStatus.BAD_GATEWAY,
                    "Wildberries returned an unsupported response encoding.");
        }
    }

    private void validateContentLength(HttpResponse<?> response, int maximumBytes) {
        response.headers().firstValueAsLong("content-length").ifPresent(length -> {
            if (length > maximumBytes) {
                throw failure("WILDBERRIES_RESPONSE_TOO_LARGE", HttpStatus.BAD_GATEWAY,
                        "Wildberries response is too large.");
            }
        });
    }

    private ProductImportException upstreamStatus(int status) {
        if (status == 403 || status == 498) {
            return failure("WILDBERRIES_FETCH_FORBIDDEN", HttpStatus.BAD_GATEWAY,
                    "Wildberries refused the import request.");
        }
        if (status == 404) {
            return failure("WILDBERRIES_PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND,
                    "Wildberries product was not found.");
        }
        if (status == 429) {
            return failure("WILDBERRIES_UPSTREAM_RATE_LIMITED", HttpStatus.BAD_GATEWAY,
                    "Wildberries temporarily limited import requests.");
        }
        return failure("WILDBERRIES_FETCH_FAILED", HttpStatus.BAD_GATEWAY,
                "Wildberries returned an unexpected response.");
    }

    private boolean isRedirect(int status) {
        return status == 301 || status == 302 || status == 303 || status == 307 || status == 308;
    }

    private ProductImportException findImportFailure(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof ProductImportException importException) return importException;
            current = current.getCause();
        }
        return null;
    }

    private ProductImportException failure(String code, HttpStatus status, String message) {
        return new ProductImportException(code, status, message);
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
                            "WILDBERRIES_RESPONSE_TOO_LARGE", HttpStatus.BAD_GATEWAY,
                            "Wildberries response is too large."
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
            // Direct connections intentionally ignore ambient proxy settings.
        }
    }
}
