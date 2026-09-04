package com.shop.vympel.controllers;

import com.shop.vympel.dtos.product.KaspiProductImportRequest;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.security.ratelimit.RateLimitService;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.marketplace.kaspi.KaspiProductImportService;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.product.ProductBulkCreationService;
import com.shop.vympel.services.product.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CrmProductControllerKaspiTest {
    @Test
    void enforcesAuthenticatedActorAndGlobalBudgetsBeforePreviewing() {
        KaspiProductImportService importService = mock(KaspiProductImportService.class);
        RateLimitService rateLimitService = mock(RateLimitService.class);
        Authentication authentication = mock(Authentication.class);
        KaspiProductImportRequest request = new KaspiProductImportRequest(
                "https://kaspi.kz/shop/p/watch-123", 77L
        );
        KaspiProductImportResponse expected = mock(KaspiProductImportResponse.class);
        when(authentication.getName()).thenReturn("manager@example.com");
        when(importService.preview(request)).thenReturn(expected);
        CrmProductController controller = new CrmProductController(
                mock(ProductService.class),
                mock(ProductBulkCreationService.class),
                mock(CrmActivityService.class),
                mock(ObjectStorageService.class),
                importService,
                rateLimitService
        );

        KaspiProductImportResponse actual = controller.importKaspiProduct(request, authentication);

        assertSame(expected, actual);
        verify(rateLimitService).enforce("crm-product-import-actor", "actor", "manager@example.com");
        verify(rateLimitService).enforce("crm-product-import-global", "global", "all-crm-product-imports");
        verify(importService).preview(request);
    }
}
