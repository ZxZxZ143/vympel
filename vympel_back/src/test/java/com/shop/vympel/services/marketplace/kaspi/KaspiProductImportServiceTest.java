package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportRequest;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.catalog.CatalogCategoryProfileService;
import com.shop.vympel.services.crm.CrmReferenceService;
import com.shop.vympel.services.product.ProductService;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KaspiProductImportServiceTest {
    @Test
    void createsAPreviewWithoutAnyProductPersistenceDependency() {
        KaspiPageFetcher fetcher = mock(KaspiPageFetcher.class);
        KaspiProductParser parser = mock(KaspiProductParser.class);
        KaspiCharacteristicMapper mapper = mock(KaspiCharacteristicMapper.class);
        CatalogCategoryProfileService profiles = mock(CatalogCategoryProfileService.class);
        CrmReferenceService references = mock(CrmReferenceService.class);
        KaspiProductImportService service = new KaspiProductImportService(fetcher, parser, mapper, profiles, references);
        KaspiProductImportRequest request = new KaspiProductImportRequest(
                "https://kaspi.kz/shop/p/watch-123", 77L
        );
        KaspiPageFetcher.FetchedPage page = new KaspiPageFetcher.FetchedPage(request.url(), "<h1>Watch</h1>");
        KaspiParsedProduct parsed = new KaspiParsedProduct("Watch", null, null, null, null, List.of(), List.of());
        CrmReferencesResponse referenceData = new CrmReferencesResponse(
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );
        KaspiProductImportResponse expected = new KaspiProductImportResponse(
                "KASPI", request.url(), 77L, CatalogCategoryProfile.WRISTWATCH,
                new KaspiProductImportResponse.Values(
                        "Watch", null, null, null, null, request.url(), null, null, null
                ),
                List.of(), List.of(), List.of(), List.of(), List.of()
        );
        when(profiles.profileForPublicCategoryId(77L)).thenReturn(CatalogCategoryProfile.WRISTWATCH);
        when(fetcher.fetch(request.url())).thenReturn(page);
        when(parser.parse(page.html(), page.finalUrl())).thenReturn(parsed);
        when(references.getReferences(com.shop.vympel.enums.Language.RU)).thenReturn(referenceData);
        when(mapper.map(parsed, page.finalUrl(), 77L, CatalogCategoryProfile.WRISTWATCH, referenceData))
                .thenReturn(expected);

        assertEquals(expected, service.preview(request));
        verify(mapper).map(parsed, page.finalUrl(), 77L, CatalogCategoryProfile.WRISTWATCH, referenceData);
        assertFalse(Arrays.stream(KaspiProductImportService.class.getDeclaredFields())
                .map(Field::getType)
                .anyMatch(type -> ProductService.class.isAssignableFrom(type)
                        || type.getSimpleName().contains("Repository")
                        || type.getSimpleName().contains("EntityManager")));
    }
}
