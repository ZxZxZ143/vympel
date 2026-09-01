package com.shop.vympel.services.marketplace.kaspi;

import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportRequest;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ProductImportException;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.catalog.CatalogCategoryProfileService;
import com.shop.vympel.services.crm.CrmReferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;

@Service
@RequiredArgsConstructor
@Slf4j
public class KaspiProductImportService {
    private final KaspiPageFetcher pageFetcher;
    private final KaspiProductParser parser;
    private final KaspiCharacteristicMapper mapper;
    private final CatalogCategoryProfileService categoryProfileService;
    private final CrmReferenceService referenceService;

    public KaspiProductImportResponse preview(KaspiProductImportRequest request) {
        long startedAt = System.nanoTime();
        String sourceHost = safeHost(request.url());
        try {
            CatalogCategoryProfile profile = categoryProfileService.profileForPublicCategoryId(request.categoryId());
            KaspiPageFetcher.FetchedPage page = pageFetcher.fetch(request.url());
            KaspiParsedProduct parsed = parser.parse(page.html(), page.finalUrl());
            if (blank(parsed.name()) && parsed.characteristics().isEmpty()) {
                throw new ProductImportException(
                        "KASPI_PARSE_FAILED", HttpStatus.UNPROCESSABLE_ENTITY,
                        "Kaspi product data could not be recognized."
                );
            }

            CrmReferencesResponse references = referenceService.getReferences(Language.RU);
            KaspiProductImportResponse response = mapper.map(
                    parsed, page.finalUrl(), request.categoryId(), profile, references
            );
            log.info(
                    "Kaspi import preview completed host={} profile={} durationMs={} parsedCharacteristics={} mappedCharacteristics={} unresolvedCharacteristics={}",
                    sourceHost,
                    profile,
                    elapsedMillis(startedAt),
                    parsed.characteristics().size(),
                    response.mappedCharacteristics().size(),
                    response.unresolvedCharacteristics().size()
            );
            return response;
        } catch (ProductImportException ex) {
            log.warn("Kaspi import preview failed host={} code={} durationMs={}",
                    sourceHost, ex.getCode(), elapsedMillis(startedAt));
            throw ex;
        }
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    private String safeHost(String rawUrl) {
        try {
            String host = URI.create(rawUrl == null ? "" : rawUrl).getHost();
            return host == null ? "invalid" : host;
        } catch (IllegalArgumentException ex) {
            return "invalid";
        }
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
