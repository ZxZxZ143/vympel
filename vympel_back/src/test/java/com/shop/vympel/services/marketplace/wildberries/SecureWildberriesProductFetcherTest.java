package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.exceptions.ProductImportException;
import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.net.InetAddress;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.util.List;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Flow;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SecureWildberriesProductFetcherTest {
    @Test
    @SuppressWarnings("unchecked")
    void mapsTheWholeOperationHttpDeadlineToAStableTimeoutError() throws Exception {
        WildberriesUrlGuard guard = new WildberriesUrlGuard(host -> new InetAddress[]{
                InetAddress.getByAddress(host, new byte[]{93, (byte) 184, (byte) 216, 34})
        });
        HttpClient client = mock(HttpClient.class);
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenThrow(new HttpTimeoutException("deadline"));
        SecureWildberriesProductFetcher fetcher = new SecureWildberriesProductFetcher(guard, client);

        ProductImportException failure = assertThrows(
                ProductImportException.class,
                () -> fetcher.fetch("https://global.wildberries.ru/catalog/320159542/detail.aspx")
        );

        assertEquals("WILDBERRIES_FETCH_TIMEOUT", failure.getCode());
    }

    @Test
    void boundedSubscriberRejectsTheFirstByteBeyondTheSharedCap() {
        SecureWildberriesProductFetcher.BoundedBodySubscriber accepted =
                new SecureWildberriesProductFetcher.BoundedBodySubscriber(4);
        RecordingSubscription acceptedSubscription = new RecordingSubscription();
        accepted.onSubscribe(acceptedSubscription);
        accepted.onNext(List.of(ByteBuffer.wrap("test".getBytes(StandardCharsets.UTF_8))));
        assertFalse(accepted.getBody().toCompletableFuture().isDone());
        accepted.onComplete();
        assertArrayEquals("test".getBytes(StandardCharsets.UTF_8), accepted.getBody().toCompletableFuture().join());

        SecureWildberriesProductFetcher.BoundedBodySubscriber rejected =
                new SecureWildberriesProductFetcher.BoundedBodySubscriber(4);
        RecordingSubscription rejectedSubscription = new RecordingSubscription();
        rejected.onSubscribe(rejectedSubscription);
        rejected.onNext(List.of(ByteBuffer.wrap("tests".getBytes(StandardCharsets.UTF_8))));
        CompletionException failure = assertThrows(
                CompletionException.class,
                () -> rejected.getBody().toCompletableFuture().join()
        );
        assertEquals("WILDBERRIES_RESPONSE_TOO_LARGE", ((ProductImportException) failure.getCause()).getCode());
        assertTrue(rejectedSubscription.cancelled);
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
