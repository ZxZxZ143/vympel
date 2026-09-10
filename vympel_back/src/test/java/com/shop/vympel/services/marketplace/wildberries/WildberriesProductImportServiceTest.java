package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.dtos.product.WildberriesProductImportRequest;
import com.shop.vympel.dtos.product.WildberriesProductImportResponse;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.catalog.CatalogCategoryProfileService;
import com.shop.vympel.services.crm.CrmReferenceService;
import com.shop.vympel.services.marketplace.kaspi.KaspiCharacteristicMapper;
import com.shop.vympel.services.marketplace.kaspi.KaspiParsedProduct;
import com.shop.vympel.services.product.ProductService;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WildberriesProductImportServiceTest {
    @Test
    void createsPreviewOnlyAndConvertsTheSharedMapperLinkToWildberries() {
        WildberriesProductFetcher fetcher = mock(WildberriesProductFetcher.class);
        WildberriesProductParser parser = mock(WildberriesProductParser.class);
        KaspiCharacteristicMapper mapper = mock(KaspiCharacteristicMapper.class);
        CatalogCategoryProfileService profiles = mock(CatalogCategoryProfileService.class);
        CrmReferenceService references = mock(CrmReferenceService.class);
        WildberriesProductImportService service = new WildberriesProductImportService(
                fetcher, parser, mapper, profiles, references
        );
        String url = "https://global.wildberries.ru/catalog/320159542/detail.aspx";
        WildberriesProductImportRequest request = new WildberriesProductImportRequest(url, 77L);
        WildberriesProductFetcher.FetchedProduct fetched = new WildberriesProductFetcher.FetchedProduct(
                url, 320159542L, "{}", "{}"
        );
        KaspiParsedProduct parsed = new KaspiParsedProduct(
                "Watch", null, "RM8", 38_280, "Описание", List.of(), List.of()
        );
        CrmReferencesResponse referenceData = mock(CrmReferencesResponse.class);
        KaspiProductImportResponse shared = new KaspiProductImportResponse(
                "KASPI", url, 77L, CatalogCategoryProfile.WRISTWATCH,
                new KaspiProductImportResponse.Values(
                        "Watch", null, "RM8", 38_280, "Описание", url, null, null, null
                ),
                List.of(new KaspiProductImportResponse.MappedField("kaspiUrl", url)),
                List.of(), List.of(), List.of(), List.of()
        );
        when(profiles.profileForPublicCategoryId(77L)).thenReturn(CatalogCategoryProfile.WRISTWATCH);
        when(fetcher.fetch(url)).thenReturn(fetched);
        when(parser.parse("{}", "{}", 320159542L))
                .thenReturn(new WildberriesParsedProduct(parsed, "Часы наручные"));
        when(references.getReferences(com.shop.vympel.enums.Language.RU)).thenReturn(referenceData);
        when(mapper.map(parsed, url, 77L, CatalogCategoryProfile.WRISTWATCH, referenceData)).thenReturn(shared);

        WildberriesProductImportResponse response = service.preview(request);

        assertEquals("WILDBERRIES", response.source());
        assertEquals(url, response.values().wildberriesUrl());
        assertTrue(response.mappedFields().stream().anyMatch(field -> field.targetField().equals("wildberriesUrl")));
        assertFalse(response.warnings().contains("SOURCE_CATEGORY_MISMATCH"));
        assertFalse(Arrays.stream(WildberriesProductImportService.class.getDeclaredFields())
                .map(Field::getType)
                .anyMatch(type -> ProductService.class.isAssignableFrom(type)
                        || type.getSimpleName().contains("Repository")
                        || type.getSimpleName().contains("EntityManager")));
    }
}
