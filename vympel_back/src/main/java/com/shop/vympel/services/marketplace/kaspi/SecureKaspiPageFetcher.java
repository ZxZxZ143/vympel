package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.exceptions.ProductImportException;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.ConnectException;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
public class SecureKaspiPageFetcher implements KaspiPageFetcher {
    static final int MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
    private static final int MAX_REDIRECTS = 3;
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(12);

    private final KaspiUrlGuard urlGuard;
    private final HttpClient httpClient;

    @Autowired
    public SecureKaspiPageFetcher(KaspiUrlGuard urlGuard) {
        this(urlGuard, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .proxy(new DirectProxySelector())
                .build());
    }

    SecureKaspiPageFetcher(KaspiUrlGuard urlGuard, HttpClient httpClient) {
        this.urlGuard = urlGuard;
        this.httpClient = httpClient;
    }

    @Override
    public FetchedPage fetch(String sourceUrl) {
        URI current = urlGuard.validate(sourceUrl).uri();
        for (int redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
            HttpResponse<InputStream> response = send(current);
            int status = response.statusCode();
            if (isRedirect(status)) {
                closeQuietly(response.body());
                if (redirects == MAX_REDIRECTS) {
                    throw failure("KASPI_REDIRECT_REJECTED", HttpStatus.BAD_GATEWAY,
                            "Kaspi returned too many redirects.");
                }
                current = validatedRedirect(current, response.headers().firstValue("location"));
                continue;
            }
            if (status != 200) {
                closeQuietly(response.body());
                throw upstreamStatus(status);
            }
            validateContentType(response);
            validateContentLength(response);
            return new FetchedPage(current.toString(), readBounded(response.body()));
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

    private HttpResponse<InputStream> send(URI uri) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(REQUEST_TIMEOUT)
                .header("Accept", "text/html,application/xhtml+xml")
                .header("Accept-Encoding", "identity")
                .header("User-Agent", "VympelCatalogImporter/1.0")
                .GET()
                .build();
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
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
            closeQuietly(response.body() instanceof InputStream stream ? stream : null);
            throw failure("KASPI_RESPONSE_INVALID", HttpStatus.BAD_GATEWAY,
                    "Kaspi returned an unsupported response.");
        }
    }

    private void validateContentLength(HttpResponse<?> response) {
        response.headers().firstValueAsLong("content-length").ifPresent(length -> {
            if (length > MAX_RESPONSE_BYTES) {
                closeQuietly(response.body() instanceof InputStream stream ? stream : null);
                throw failure("KASPI_RESPONSE_TOO_LARGE", HttpStatus.BAD_GATEWAY,
                        "Kaspi response is too large.");
            }
        });
    }

    private String readBounded(InputStream body) {
        try (InputStream stream = body; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int total = 0;
            int read;
            while ((read = stream.read(buffer)) != -1) {
                total += read;
                if (total > MAX_RESPONSE_BYTES) {
                    throw failure("KASPI_RESPONSE_TOO_LARGE", HttpStatus.BAD_GATEWAY,
                            "Kaspi response is too large.");
                }
                output.write(buffer, 0, read);
            }
            return output.toString(StandardCharsets.UTF_8);
        } catch (ProductImportException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ProductImportException(
                    "KASPI_FETCH_FAILED", HttpStatus.BAD_GATEWAY, "Kaspi response could not be read.", ex
            );
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

    private void closeQuietly(InputStream stream) {
        if (stream == null) return;
        try {
            stream.close();
        } catch (IOException ignored) {
            // The response is already being discarded.
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
