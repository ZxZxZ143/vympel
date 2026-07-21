package com.shop.vympel.controllers;

import com.shop.vympel.dtos.catalog.CatalogFiltersResponse;
import com.shop.vympel.dtos.catalog.CatalogProductQuery;
import com.shop.vympel.dtos.product.ProductQuickSearchResponse;
import com.shop.vympel.dtos.product.ProductRecommendationResponse;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.product.ProductBatchSummaryRequest;
import com.shop.vympel.dtos.product.ProductBatchSummaryResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.InvalidSortException;
import com.shop.vympel.dtos.review.ProductReviewCreateRequest;
import com.shop.vympel.dtos.review.ProductReviewSubmissionResponse;
import com.shop.vympel.dtos.review.PublicProductReviewResponse;
import com.shop.vympel.services.catalog.ProductCatalogService;
import com.shop.vympel.services.product.ProductService;
import com.shop.vympel.services.product.ProductRecommendationService;
import com.shop.vympel.services.product.ProductBatchSummaryService;
import com.shop.vympel.services.review.ProductReviewService;
import com.shop.vympel.security.ratelimit.AbuseProtectionService;
import jakarta.servlet.http.HttpServletRequest;
import com.shop.vympel.utils.PageableUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.MultiValueMap;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/product")
@RequiredArgsConstructor
@Slf4j
public class ProductPublicController {
    private static final int QUICK_SEARCH_DEFAULT_LIMIT = 6;
    private static final int QUICK_SEARCH_MAX_LIMIT = 8;
    private static final int PUBLIC_PRODUCT_MAX_SIZE = 60;
    private static final long PRODUCT_BATCH_MAX_BODY_BYTES = 4096;
    private static final int PRODUCT_REVIEW_DEFAULT_SIZE = 15;
    private static final int PRODUCT_REVIEW_MAX_SIZE = 15;
    private static final Set<String> CATALOG_CONTROL_PARAMS = Set.of(
            "page", "size", "sort", "categoryCode", "search", "priceMin", "priceMax", "minPrice", "maxPrice"
    );

    private static final Set<String> REMOVED_CATALOG_FILTER_PARAMS = Set.of(
            "brandCountry", "manufacturerCountry", "countryOfBrand"
    );

    private final ProductService productService;
    private final ProductCatalogService productCatalogService;
    private final ProductReviewService productReviewService;
    private final ProductRecommendationService productRecommendationService;
    private final ProductBatchSummaryService productBatchSummaryService;
    private final AbuseProtectionService abuseProtectionService;

    @GetMapping("/{lang}/{id}")
    public ResponseEntity<ProductResponse> getProduct(
            @PathVariable Long id,
            @PathVariable Language lang
    ) {
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(productService.get(id, lang));
    }

    @PostMapping("/batch-summary/{lang}")
    public ResponseEntity<ProductBatchSummaryResponse> getProductBatchSummaries(
            @PathVariable Language lang,
            @Valid @RequestBody ProductBatchSummaryRequest request,
            HttpServletRequest servletRequest
    ) {
        if (servletRequest.getContentLengthLong() > PRODUCT_BATCH_MAX_BODY_BYTES) {
            throw new IllegalArgumentException("Product summary batch body must not exceed 4096 bytes");
        }
        return ResponseEntity.ok(productBatchSummaryService.getSummaries(request.ids(), lang));
    }

    @GetMapping("/{lang}/{id}/recommendations")
    public ResponseEntity<List<ProductRecommendationResponse>> getProductRecommendations(
            @PathVariable Long id,
            @PathVariable Language lang,
            @RequestParam(required = false) Integer limit
    ) {
        try {
            return ResponseEntity.ok(productRecommendationService.getRecommendations(id, lang, limit));
        } catch (RuntimeException exception) {
            log.error(
                    "Recommendation endpoint failed productId={} locale={} limit={}",
                    id,
                    lang.getValue(),
                    limit,
                    exception
            );
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/{lang}/{id}/reviews")
    public ResponseEntity<Page<PublicProductReviewResponse>> getProductReviews(
            @PathVariable Long id,
            @PathVariable Language lang,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String hasText
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page == null ? 0 : page, 0),
                boundedProductReviewSize(size)
        );

        return ResponseEntity.ok(productReviewService.getApproved(
                id,
                rating,
                parseOptionalBoolean(hasText, "hasText"),
                sort,
                pageable
        ));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<ProductReviewSubmissionResponse> createProductReview(
            @PathVariable Long id,
            @RequestBody @Valid ProductReviewCreateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        abuseProtectionService.enforceReviewDuplicate(id, request, servletRequest);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productReviewService.create(id, request, authentication));
    }

    @GetMapping("/by-id/{lang}/{categoryId}")
    public ResponseEntity<Page<ProductShortResponse>> getProducts(
            @PathVariable @NotNull Language lang,
            @PathVariable @NotNull Long categoryId,
            Pageable pageable
    ) {
        Pageable mappedPageable = mapToProductSort(pageable);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(productService.getAll(mappedPageable, lang, categoryId));
    }

    @GetMapping("/by-code/{lang}/{categoryCode}")
    public ResponseEntity<Page<ProductShortResponse>> getProductsByCategoryCode(
            @PathVariable @NotNull Language lang,
            @PathVariable @NotNull String categoryCode,
            Pageable pageable
    ) {
        Pageable mappedPageable = mapToProductSort(pageable);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(productService.getAllByCategoryCode(mappedPageable, lang, categoryCode));
    }

    @GetMapping("/catalog/{lang}")
    public ResponseEntity<Page<ProductShortResponse>> getCatalogProducts(
            @PathVariable @NotNull Language lang,
            @RequestParam MultiValueMap<String, String> requestParams,
            Pageable pageable
    ) {
        Pageable mappedPageable = mapToProductSort(pageable);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(productCatalogService.getProducts(toCatalogQuery(requestParams), mappedPageable, lang));
    }

    @GetMapping("/search/quick/{lang}")
    public ResponseEntity<List<ProductQuickSearchResponse>> quickSearchProducts(
            @PathVariable @NotNull Language lang,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(required = false) Integer limit
    ) {
        String search = selectedValue(query);
        if (search == null || search.length() < 2) {
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(List.of());
        }
        if (search.length() > 100) {
            throw new IllegalArgumentException("Search query must not exceed 100 characters");
        }

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(productCatalogService.quickSearch(search, boundedQuickSearchLimit(limit), lang));
    }

    @GetMapping("/filters/{lang}")
    public ResponseEntity<CatalogFiltersResponse> getCatalogFilters(
            @PathVariable @NotNull Language lang,
            @RequestParam(required = false) String categoryCode
    ) {
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(productCatalogService.getFilters(categoryCode, lang));
    }

    private Pageable mapToProductSort(Pageable pageable) {
        Pageable boundedPageable = PageableUtils.cap(pageable, PUBLIC_PRODUCT_MAX_SIZE);
        List<Sort.Order> orders = boundedPageable.getSort().stream()
                .map(order -> {
                    String sortKey = order.getProperty();

                    return new Sort.Order(
                            resolveDirection(sortKey),
                            resolveSort(sortKey)
                    );
                })
                .toList();

        Sort mappedSort = orders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(orders);

        return PageRequest.of(
                boundedPageable.getPageNumber(),
                boundedPageable.getPageSize(),
                mappedSort
        );
    }

    private String resolveSort(String sort) {
        return switch (sort) {
            case "newest", "oldest" -> "createdAt";
            case "priceAsc", "priceDesc" -> "price";
            case "nameAsc", "nameDesc" -> "model";
            default -> throw new InvalidSortException();
        };
    }

    private Sort.Direction resolveDirection(String sort) {
        return switch (sort) {
            case "oldest", "nameAsc", "priceAsc" -> Sort.Direction.ASC;
            case "newest", "nameDesc", "priceDesc" -> Sort.Direction.DESC;
            default -> throw new InvalidSortException();
        };
    }

    private CatalogProductQuery toCatalogQuery(MultiValueMap<String, String> requestParams) {
        return new CatalogProductQuery(
                firstValue(requestParams, "categoryCode"),
                firstValue(requestParams, "search"),
                decimalValue(requestParams, "priceMin", "minPrice"),
                decimalValue(requestParams, "priceMax", "maxPrice"),
                filterParams(requestParams)
        );
    }

    private Map<String, List<String>> filterParams(MultiValueMap<String, String> requestParams) {
        return requestParams.entrySet()
                .stream()
                .filter(entry -> !CATALOG_CONTROL_PARAMS.contains(entry.getKey()))
                .filter(entry -> !REMOVED_CATALOG_FILTER_PARAMS.contains(entry.getKey()))
                .map(entry -> Map.entry(entry.getKey(), selectedValues(entry.getValue())))
                .filter(entry -> !entry.getValue().isEmpty())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (left, right) -> {
                            List<String> merged = new java.util.ArrayList<>(left);
                            merged.addAll(right);
                            return selectedValues(merged);
                        },
                        LinkedHashMap::new
                ));
    }

    private String firstValue(MultiValueMap<String, String> requestParams, String key) {
        String value = requestParams.getFirst(key);
        return selectedValue(value);
    }

    private BigDecimal decimalValue(MultiValueMap<String, String> requestParams, String primaryKey, String aliasKey) {
        String value = firstValue(requestParams, primaryKey);
        if (value == null) {
            value = firstValue(requestParams, aliasKey);
        }

        if (value == null) {
            return null;
        }

        try {
            return new BigDecimal(value);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(primaryKey + " must be a valid number");
        }
    }

    private List<String> selectedValues(List<String> rawValues) {
        if (rawValues == null || rawValues.isEmpty()) {
            return List.of();
        }

        return rawValues.stream()
                .filter(Objects::nonNull)
                .flatMap(value -> Arrays.stream(value.split(",")))
                .map(this::selectedValue)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private String selectedValue(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return null;
        }

        String normalized = trimmed.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "null", "undefined", "[]" -> null;
            default -> trimmed;
        };
    }

    private int boundedQuickSearchLimit(Integer limit) {
        if (limit == null) {
            return QUICK_SEARCH_DEFAULT_LIMIT;
        }

        return Math.max(1, Math.min(limit, QUICK_SEARCH_MAX_LIMIT));
    }

    private int boundedProductReviewSize(Integer size) {
        if (size == null) {
            return PRODUCT_REVIEW_DEFAULT_SIZE;
        }

        return Math.max(1, Math.min(size, PRODUCT_REVIEW_MAX_SIZE));
    }

    private Boolean parseOptionalBoolean(String value, String paramName) {
        String normalized = selectedValue(value);
        if (normalized == null) {
            return null;
        }

        if ("true".equalsIgnoreCase(normalized)) {
            return true;
        }

        if ("false".equalsIgnoreCase(normalized)) {
            return false;
        }

        throw new IllegalArgumentException(paramName + " must be true or false");
    }
}
