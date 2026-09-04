package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.exceptions.ProductImportException;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Flow;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.LongSupplier;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SecureKaspiPageFetcherTest {
    @Test
    void boundedSubscriberCompletesOnlyAtEofAndRejectsTheFirstExcessByte() {
        SecureKaspiPageFetcher.BoundedBodySubscriber accepted =
                new SecureKaspiPageFetcher.BoundedBodySubscriber(4);
        RecordingSubscription acceptedSubscription = new RecordingSubscription();
        accepted.onSubscribe(acceptedSubscription);
        accepted.onNext(List.of(ByteBuffer.wrap("test".getBytes(StandardCharsets.UTF_8))));

        assertFalse(accepted.getBody().toCompletableFuture().isDone());
        accepted.onComplete();
        assertArrayEquals("test".getBytes(StandardCharsets.UTF_8), accepted.getBody().toCompletableFuture().join());
        assertFalse(acceptedSubscription.cancelled);

        SecureKaspiPageFetcher.BoundedBodySubscriber rejected =
                new SecureKaspiPageFetcher.BoundedBodySubscriber(4);
        RecordingSubscription rejectedSubscription = new RecordingSubscription();
        rejected.onSubscribe(rejectedSubscription);
        rejected.onNext(List.of(ByteBuffer.wrap("tests".getBytes(StandardCharsets.UTF_8))));

        CompletionException failure = assertThrows(
                CompletionException.class,
                () -> rejected.getBody().toCompletableFuture().join()
        );
        assertEquals("KASPI_RESPONSE_TOO_LARGE", ((ProductImportException) failure.getCause()).getCode());
        assertTrue(rejectedSubscription.cancelled);
    }

    @Test
    @SuppressWarnings("unchecked")
    void mapsAnEndToEndHttpDeadlineToTheStableTimeoutError() throws Exception {
        KaspiUrlGuard guard = new KaspiUrlGuard(host -> new java.net.InetAddress[]{
                java.net.InetAddress.getByAddress(host, new byte[]{93, (byte) 184, (byte) 216, 34})
        });
        HttpClient client = mock(HttpClient.class);
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenThrow(new HttpTimeoutException("deadline"));
        SecureKaspiPageFetcher fetcher = new SecureKaspiPageFetcher(guard, client);

        ProductImportException failure = assertThrows(
                ProductImportException.class,
                () -> fetcher.fetch("https://kaspi.kz/shop/p/watch-123")
        );

        assertEquals("KASPI_FETCH_TIMEOUT", failure.getCode());
    }

    @Test
    @SuppressWarnings("unchecked")
    void sharesOneDeadlineAcrossTheEntireRedirectChain() throws Exception {
        KaspiUrlGuard guard = new KaspiUrlGuard(host -> new java.net.InetAddress[]{
                java.net.InetAddress.getByAddress(host, new byte[]{93, (byte) 184, (byte) 216, 34})
        });
        HttpClient client = mock(HttpClient.class);
        HttpResponse<byte[]> redirect = mock(HttpResponse.class);
        when(redirect.statusCode()).thenReturn(302);
        when(redirect.headers()).thenReturn(HttpHeaders.of(
                Map.of("location", List.of("/shop/p/watch-redirected")), (name, value) -> true
        ));
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(redirect);
        LongSupplier clock = mock(LongSupplier.class);
        when(clock.getAsLong()).thenReturn(0L, 1_000_000_000L, 13_000_000_001L);
        SecureKaspiPageFetcher fetcher = new SecureKaspiPageFetcher(guard, client, 1, clock);

        ProductImportException failure = assertThrows(
                ProductImportException.class,
                () -> fetcher.fetch("https://kaspi.kz/shop/p/watch-123")
        );

        assertEquals("KASPI_FETCH_TIMEOUT", failure.getCode());
        verify(client, times(1)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void rejectsUnexpectedCompressedContentInsteadOfParsingEncodedBytes() throws Exception {
        KaspiUrlGuard guard = new KaspiUrlGuard(host -> new java.net.InetAddress[]{
                java.net.InetAddress.getByAddress(host, new byte[]{93, (byte) 184, (byte) 216, 34})
        });
        HttpClient client = mock(HttpClient.class);
        HttpResponse<byte[]> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.headers()).thenReturn(HttpHeaders.of(
                Map.of("content-type", List.of("text/html"), "content-encoding", List.of("gzip")),
                (name, value) -> true
        ));
        when(response.body()).thenReturn(new byte[]{1, 2, 3});
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(response);

        ProductImportException failure = assertThrows(
                ProductImportException.class,
                () -> new SecureKaspiPageFetcher(guard, client)
                        .fetch("https://kaspi.kz/shop/p/watch-123")
        );

        assertEquals("KASPI_RESPONSE_INVALID", failure.getCode());
    }

    @Test
    @SuppressWarnings("unchecked")
    void rejectsExcessConcurrentOutboundFetchesWithoutStartingAnotherRequest() throws Exception {
        KaspiUrlGuard guard = new KaspiUrlGuard(host -> new java.net.InetAddress[]{
                java.net.InetAddress.getByAddress(host, new byte[]{93, (byte) 184, (byte) 216, 34})
        });
        HttpClient client = mock(HttpClient.class);
        HttpResponse<byte[]> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.headers()).thenReturn(HttpHeaders.of(
                Map.of("content-type", List.of("text/html")), (name, value) -> true
        ));
        when(response.body()).thenReturn("<h1>Watch</h1>".getBytes(StandardCharsets.UTF_8));
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenAnswer(invocation -> {
            entered.countDown();
            if (!release.await(5, TimeUnit.SECONDS)) throw new HttpTimeoutException("test release timeout");
            return response;
        });
        SecureKaspiPageFetcher fetcher = new SecureKaspiPageFetcher(guard, client, 1);
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Future<KaspiPageFetcher.FetchedPage> first = executor.submit(
                    () -> fetcher.fetch("https://kaspi.kz/shop/p/watch-1")
            );
            assertTrue(entered.await(5, TimeUnit.SECONDS));

            ProductImportException busy = assertThrows(
                    ProductImportException.class,
                    () -> fetcher.fetch("https://kaspi.kz/shop/p/watch-2")
            );
            assertEquals("KASPI_IMPORT_BUSY", busy.getCode());

            release.countDown();
            assertEquals("https://kaspi.kz/shop/p/watch-1", first.get(5, TimeUnit.SECONDS).finalUrl());
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }

    private static final class RecordingSubscription implements Flow.Subscription {
        private boolean cancelled;

        @Override
        public void request(long count) {
        }

        @Override
        public void cancel() {
            cancelled = true;
        }
    }
}
