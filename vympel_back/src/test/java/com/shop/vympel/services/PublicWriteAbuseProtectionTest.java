package com.shop.vympel.services;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.CustomerRequestRepository;
import com.shop.vympel.db.repositories.analytics.ProductAnalyticsEventRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.dtos.analytics.ProductAnalyticsTrackRequest;
import com.shop.vympel.dtos.request.PublicCustomerRequestCreateRequest;
import com.shop.vympel.security.ratelimit.AbuseProtectionService;
import com.shop.vympel.security.ratelimit.RateLimitExceededException;
import com.shop.vympel.services.product.ProductAnalyticsService;
import com.shop.vympel.services.product.ProductService;
import com.shop.vympel.services.request.CustomerRequestService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PublicWriteAbuseProtectionTest {
    @Test
    void contactDuplicateIsRejectedBeforeCustomerRequestPersistence() {
        CustomerRequestRepository repository = mock(CustomerRequestRepository.class);
        AbuseProtectionService abuse = mock(AbuseProtectionService.class);
        doThrow(new RateLimitExceededException("public-request-contact", 60))
                .when(abuse).enforceCustomerRequestContact("person@example.com", null);
        CustomerRequestService service = new CustomerRequestService(
                repository, mock(UserRepository.class), abuse
        );
        PublicCustomerRequestCreateRequest request = new PublicCustomerRequestCreateRequest(
                "Person", "person@example.com", null, "Call me", "product", null
        );

        assertThrows(RateLimitExceededException.class, () -> service.create(request));
        verify(repository, never()).save(any());
    }

    @Test
    void duplicateAnalyticsEventDoesNotCreateDatabaseRow() {
        ProductRepository productRepository = mock(ProductRepository.class);
        Product product = new Product();
        when(productRepository.findById(42L)).thenReturn(Optional.of(product));
        AbuseProtectionService abuse = mock(AbuseProtectionService.class);
        when(abuse.isDuplicateAnalytics(any(), any())).thenReturn(true);
        ProductAnalyticsEventRepository events = mock(ProductAnalyticsEventRepository.class);
        ProductAnalyticsService service = new ProductAnalyticsService(
                events,
                productRepository,
                mock(ProductService.class),
                abuse,
                new SimpleMeterRegistry()
        );

        var response = service.track(
                new ProductAnalyticsTrackRequest(42L, "VIEW", "session-1"),
                new MockHttpServletRequest()
        );

        assertFalse(response.tracked());
        verify(events, never()).save(any());
    }

    @Test
    void trackedAnalyticsPersistsOnlyBusinessEventGrain() {
        ProductRepository productRepository = mock(ProductRepository.class);
        Product product = new Product();
        when(productRepository.findById(42L)).thenReturn(Optional.of(product));
        AbuseProtectionService abuse = mock(AbuseProtectionService.class);
        when(abuse.isDuplicateAnalytics(any(), any())).thenReturn(false);
        ProductAnalyticsEventRepository events = mock(ProductAnalyticsEventRepository.class);
        ProductAnalyticsService service = new ProductAnalyticsService(
                events,
                productRepository,
                mock(ProductService.class),
                abuse,
                new SimpleMeterRegistry()
        );

        service.track(new ProductAnalyticsTrackRequest(42L, "VIEW", "session-1"), new MockHttpServletRequest());

        org.mockito.ArgumentCaptor<com.shop.vympel.db.entity.analytics.ProductAnalyticsEvent> eventCaptor =
                org.mockito.ArgumentCaptor.forClass(com.shop.vympel.db.entity.analytics.ProductAnalyticsEvent.class);
        verify(events).save(eventCaptor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(product, eventCaptor.getValue().getProduct());
        org.junit.jupiter.api.Assertions.assertEquals("VIEW", eventCaptor.getValue().getEventType());
    }
}
