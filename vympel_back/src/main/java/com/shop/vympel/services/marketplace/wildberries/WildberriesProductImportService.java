package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.dtos.product.KaspiProductImportResponse;
import com.shop.vympel.dtos.product.WildberriesProductImportRequest;
import com.shop.vympel.dtos.product.WildberriesProductImportResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ProductImportException;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.catalog.CatalogCategoryProfileService;
import com.shop.vympel.services.crm.CrmReferenceService;
import com.shop.vympel.services.marketplace.kaspi.KaspiParsedProduct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class WildberriesProductImportService {
    private final WildberriesProductFetcher productFetcher;
    private final WildberriesProductParser parser;
    private final WildberriesCharacteristicMapper mapper;
    private final CatalogCategoryProfileService categoryProfileService;
    private final CrmReferenceService referenceService;

    public WildberriesProductImportResponse preview(WildberriesProductImportRequest request) {
        long startedAt = System.nanoTime();
        String sourceHost = safeHost(request.url());
        try {
            CatalogCategoryProfile profile = categoryProfileService.profileForPublicCategoryId(request.categoryId());
            WildberriesProductFetcher.FetchedProduct fetched = productFetcher.fetch(request.url());
            WildberriesParsedProduct parsedSource = parser.parse(
                    fetched.catalogJson(), fetched.detailsJson(), fetched.productId()
            );
            KaspiParsedProduct parsed = parsedSource.product();
            if (blank(parsed.name()) && parsed.characteristics().isEmpty()) {
                throw new ProductImportException(
                        "WILDBERRIES_PARSE_FAILED", HttpStatus.UNPROCESSABLE_ENTITY,
                        "Wildberries product data could not be recognized."
                );
            }

            CrmReferencesResponse references = referenceService.getReferences(Language.RU);
            KaspiProductImportResponse mapped = mapper.map(
                    parsed, fetched.canonicalUrl(), request.categoryId(), profile, references
            );
            List<String> warnings = new ArrayList<>(mapped.warnings());
            if (!categoryLooksCompatible(profile, parsedSource.sourceCategory())) {
                warnings.add("SOURCE_CATEGORY_MISMATCH");
            }
            List<KaspiProductImportResponse.MappedField> mappedFields = mapped.mappedFields().stream()
                    .filter(field -> !"descriptionRu".equals(field.targetField()))
                    .map(field -> "kaspiUrl".equals(field.targetField())
                            ? new KaspiProductImportResponse.MappedField("wildberriesUrl", field.resolvedValue())
                            : field)
                    .toList();
            KaspiProductImportResponse.Values values = mapped.values();
            WildberriesProductImportResponse response = new WildberriesProductImportResponse(
                    "WILDBERRIES",
                    fetched.canonicalUrl(),
                    request.categoryId(),
                    profile,
                    new WildberriesProductImportResponse.Values(
                            values.nameRu(), values.brandId(), values.model(), values.price(), null,
                            fetched.canonicalUrl(), values.watchDetails(), values.interiorClockDetails(), values.accessoryDetails()
                    ),
                    mappedFields,
                    mapped.mappedCharacteristics(),
                    mapped.unmappedCharacteristics(),
                    mapped.unresolvedCharacteristics(),
                    List.copyOf(warnings)
            );
            log.info(
                    "Wildberries import preview completed host={} profile={} durationMs={} parsedCharacteristics={} mappedCharacteristics={} unresolvedCharacteristics={}",
                    sourceHost, profile, elapsedMillis(startedAt), parsed.characteristics().size(),
                    response.mappedCharacteristics().size(), response.unresolvedCharacteristics().size()
            );
            return response;
        } catch (ProductImportException ex) {
            log.warn("Wildberries import preview failed host={} code={} durationMs={}",
                    sourceHost, ex.getCode(), elapsedMillis(startedAt));
            throw ex;
        }
    }

    private boolean categoryLooksCompatible(CatalogCategoryProfile profile, String sourceCategory) {
        if (sourceCategory == null || profile == CatalogCategoryProfile.GENERIC) return true;
        String normalized = sourceCategory.toLowerCase(Locale.ROOT).replace('ё', 'е');
        return switch (profile) {
            case WRISTWATCH -> normalized.contains("час") && normalized.contains("наруч");
            case INTERIOR_CLOCK -> normalized.contains("час")
                    && (normalized.contains("настенн") || normalized.contains("настольн") || normalized.contains("интерьер"));
            case ACCESSORY -> normalized.contains("ремеш") || normalized.contains("браслет")
                    || normalized.contains("аксессуар");
            case GENERIC -> true;
        };
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
