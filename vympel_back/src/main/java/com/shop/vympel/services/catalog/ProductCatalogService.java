package com.shop.vympel.services.catalog;

import com.shop.vympel.db.entity.features.*;
import com.shop.vympel.db.entity.i18n.*;
import com.shop.vympel.db.entity.product.Category;
import com.shop.vympel.db.entity.product.InteriorClockDetail;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.ProductCategory;
import com.shop.vympel.db.entity.product.WatchDetail;
import com.shop.vympel.db.repositories.CountryRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.db.repositories.product.CatalogFacetRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository.PublicProductSummary;
import com.shop.vympel.db.repositories.product.features.*;
import com.shop.vympel.db.repositories.product.watchDetail.InteriorClockDetailRepository;
import com.shop.vympel.db.repositories.product.watchDetail.WatchDetailRepository;
import com.shop.vympel.dtos.catalog.*;
import com.shop.vympel.dtos.product.ProductQuickSearchResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.features.FeatureDto;
import com.shop.vympel.enums.Language;
import com.shop.vympel.mappers.product.ProductMapper;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.productName.ProductNameService;
import com.shop.vympel.services.review.ProductReviewService;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductCatalogService {
    private static final double SEARCH_SIMILARITY_THRESHOLD = 0.25;
    private static final int QUICK_SEARCH_DEFAULT_LIMIT = 6;
    private static final int QUICK_SEARCH_MAX_LIMIT = 8;
    private static final String COUNTRY_FILTER_KEY = "country";
    private static final String PRODUCT_FILTER_SOURCE = "product";
    private static final String BRAND_COUNTRY_FILTER_SOURCE = "brand_country";
    private static final String WATCH_DETAIL_FILTER_SOURCE = "watch_details";
    private static final String INTERIOR_DETAIL_FILTER_SOURCE = "interior_clock_details";
    private static final Map<String, String> WRISTWATCH_DETAIL_FILTER_FIELDS = Map.of(
            "mechanism", "mechanism",
            "gender", "gender",
            "caseMaterial", "caseMaterial",
            "strapMaterial", "strapMaterial",
            "glassType", "glassType",
            "stoneInlay", "stoneInlay"
    );
    private static final Map<String, String> INTERIOR_DETAIL_FILTER_FIELDS = Map.of(
            "interiorCaseMaterial", "caseMaterial",
            "interiorColor", "color",
            "interiorStyle", "style",
            "interiorMechanismType", "mechanismType",
            "powerType", "powerType"
    );

    private final ProductRepository productRepository;
    private final PublicProductQueryService publicProductQueryService;
    private final ProductMapper productMapper;
    private final ProductNameService productNameService;
    private final ObjectStorageService objectStorageService;
    private final CatalogCategoryProfileService categoryProfileService;
    private final BrandRepository brandRepository;
    private final WatchDetailRepository watchDetailRepository;
    private final InteriorClockDetailRepository interiorClockDetailRepository;
    private final CountryRepository countryRepository;
    private final MechanismI18nRepository mechanismI18nRepository;
    private final GenderI18nRepository genderI18nRepository;
    private final MaterialI18nRepository materialI18nRepository;
    private final GlassTypeI18nRepository glassTypeI18nRepository;
    private final StoneInlayI18nRepository stoneInlayI18nRepository;
    private final CountryI18nRepository countryI18nRepository;
    private final InteriorFeatureI18nRepository interiorFeatureI18nRepository;
    private final CollectionI18nRepository collectionI18nRepository;
    private final ProductReviewService productReviewService;
    private final CatalogFacetRepository catalogFacetRepository;
    private final PublicProductSummaryRepository publicProductSummaryRepository;
    private final MeterRegistry meterRegistry;
    @Value("${app.performance.slow-operation-threshold-ms:500}")
    private long slowOperationThresholdMs = 500;

    @Transactional(readOnly = true)
    public Page<ProductShortResponse> getProducts(CatalogProductQuery catalogQuery, Pageable pageable, Language language) {
        long started = System.nanoTime();
        CatalogCategoryContext context = categoryProfileService.resolveContext(catalogQuery.getCategoryCode());
        Specification<Product> specification = catalogSpecification(catalogQuery, context);

        Page<Long> productIds = publicProductQueryService.findIds(specification, pageable);
        List<ProductShortResponse> content = orderedSummaries(productIds.getContent(), language).stream()
                .map(this::toShortResponse)
                .toList();
        Page<ProductShortResponse> response = new PageImpl<>(content, pageable, productIds.getTotalElements());
        recordMetric("catalog", "generic", 3, started);
        return response;
    }

    @Transactional(readOnly = true)
    public List<ProductQuickSearchResponse> quickSearch(String rawSearch, Integer limit, Language language) {
        long started = System.nanoTime();
        String search = selectedValue(rawSearch);
        if (search == null || search.length() < 2) {
            return List.of();
        }

        int pageSize = boundedQuickSearchLimit(limit);
        CatalogCategoryContext context = categoryProfileService.resolveContext(null);
        Specification<Product> specification = catalogSpecification(
                new CatalogProductQuery(null, search, null, null, Map.of()),
                context
        );
        List<Long> productIds = publicProductQueryService.findIds(
                specification,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                pageSize
        );

        List<ProductQuickSearchResponse> response = orderedSummaries(productIds, language).stream()
                .map(this::toQuickSearchResponse)
                .toList();
        recordMetric("quick_search", "generic", 2, started);
        return response;
    }

    @Transactional(readOnly = true)
    public CatalogFiltersResponse getFilters(String categoryCode, Language language) {
        long started = System.nanoTime();
        CatalogCategoryContext context = categoryProfileService.resolveContext(categoryCode);
        List<CatalogFacetRepository.FacetRow> baseRows = catalogFacetRepository.findBaseFacets(
                context.getScopeCategoryIds(), language.getValue());
        List<CatalogFilterResponse> filters = new ArrayList<>();
        filters.add(rangeFacet("price", PRODUCT_FILTER_SOURCE, baseRows, language));
        filters.add(optionFacet("brand", PRODUCT_FILTER_SOURCE, baseRows, language));
        filters.add(optionFacet(COUNTRY_FILTER_KEY, BRAND_COUNTRY_FILTER_SOURCE, baseRows, language));

        if (context.getProfile() == CatalogCategoryProfile.WRISTWATCH) {
            List<CatalogFacetRepository.FacetRow> rows = catalogFacetRepository.findWristFacets(
                    context.getScopeCategoryIds(), language.getValue());
            for (String key : List.of("mechanism", "gender", "caseMaterial", "strapMaterial", "glassType", "stoneInlay", "caseSize")) {
                filters.add(optionFacet(key, WATCH_DETAIL_FILTER_SOURCE, rows, language));
            }
        } else if (context.getProfile() == CatalogCategoryProfile.INTERIOR_CLOCK) {
            List<CatalogFacetRepository.FacetRow> rows = catalogFacetRepository.findInteriorFacets(
                    context.getScopeCategoryIds(), language.getValue());
            for (String key : List.of("interiorCaseMaterial", "interiorColor", "interiorStyle", "interiorMechanismType", "powerType")) {
                filters.add(optionFacet(key, INTERIOR_DETAIL_FILTER_SOURCE, rows, language));
            }
        }

        CatalogFiltersResponse response = new CatalogFiltersResponse(categoryContextResponse(context, language), filters);
        int queryCount = context.getProfile() == CatalogCategoryProfile.WRISTWATCH
                || context.getProfile() == CatalogCategoryProfile.INTERIOR_CLOCK ? 2 : 1;
        recordMetric("facets", context.getProfile().name().toLowerCase(Locale.ROOT), queryCount, started);
        return response;
    }

    private void recordMetric(String operation, String profile, int queryCount, long started) {
        long duration = System.nanoTime() - started;
        meterRegistry.summary("vympel.public.catalog.queries", "operation", operation, "profile", profile)
                .record(queryCount);
        Timer.builder("vympel.public.catalog.duration")
                .tag("operation", operation)
                .tag("profile", profile)
                .register(meterRegistry)
                .record(duration, java.util.concurrent.TimeUnit.NANOSECONDS);
        if (duration >= java.util.concurrent.TimeUnit.MILLISECONDS.toNanos(slowOperationThresholdMs)) {
            log.warn("Slow public catalog operation operation={} profile={} durationMs={} queryCount={}",
                    operation, profile, java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(duration), queryCount);
        }
    }

    private CatalogFilterResponse rangeFacet(
            String key,
            String source,
            List<CatalogFacetRepository.FacetRow> rows,
            Language language
    ) {
        CatalogFacetRepository.FacetRow row = rows.stream()
                .filter(candidate -> key.equals(candidate.key()))
                .findFirst()
                .orElse(new CatalogFacetRepository.FacetRow(key, null, null, 0, BigDecimal.ZERO, BigDecimal.ZERO));
        BigDecimal min = row.min() == null ? BigDecimal.ZERO : row.min();
        BigDecimal max = row.max() == null ? BigDecimal.ZERO : row.max();
        return new CatalogFilterResponse(key, label(key, language), "range", source, List.of(), min, max);
    }

    private CatalogFilterResponse optionFacet(
            String key,
            String source,
            List<CatalogFacetRepository.FacetRow> rows,
            Language language
    ) {
        List<CatalogFilterOptionResponse> options = rows.stream()
                .filter(row -> key.equals(row.key()) && row.value() != null)
                .map(row -> new CatalogFilterOptionResponse(row.value(), row.label(), row.count(), row.count() == 0))
                .sorted(Comparator.comparing(CatalogFilterOptionResponse::getLabel, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
        return new CatalogFilterResponse(key, label(key, language), "checkbox", source, options, null, null);
    }

    private List<PublicProductSummary> orderedSummaries(List<Long> ids, Language language) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, PublicProductSummary> byId = publicProductSummaryRepository.findAllByIds(ids, language.getValue())
                .stream()
                .collect(java.util.stream.Collectors.toMap(PublicProductSummary::productId, Function.identity()));
        return ids.stream().map(byId::get).filter(Objects::nonNull).toList();
    }

    private ProductShortResponse toShortResponse(PublicProductSummary summary) {
        return new ProductShortResponse(
                summary.productId(), summary.name(), summary.model(), integerPrice(summary.price()),
                summary.stockQuantity(), summary.status(), objectStorageService.getPublicLink(summary.imageKey()),
                summary.kaspiUrl(), summary.wildberriesUrl(), collectionResponse(summary),
                summary.ratingAverage(), summary.ratingCount()
        );
    }

    private ProductQuickSearchResponse toQuickSearchResponse(PublicProductSummary summary) {
        FeatureDto brand = summary.brandId() == null ? null : new FeatureDto(summary.brandId(), summary.brandName());
        return new ProductQuickSearchResponse(
                summary.productId(), summary.name(), summary.model(), summary.sku(), brand,
                collectionResponse(summary), integerPrice(summary.price()), summary.stockQuantity(),
                summary.status(), objectStorageService.getPublicLink(summary.imageKey())
        );
    }

    private CollectionResponse collectionResponse(PublicProductSummary summary) {
        if (summary.collectionId() == null) {
            return null;
        }
        CollectionResponse response = new CollectionResponse();
        response.setId(summary.collectionId());
        response.setName(summary.collectionName());
        return response;
    }

    private Integer integerPrice(BigDecimal price) {
        return price == null ? null : price.intValue();
    }

    private ProductShortResponse toShortResponse(Product product, Language language) {
        ProductShortResponse response = productMapper.toShortResponse(product);
        response.setImageUrl(firstImageUrl(product.getId()));
        response.setName(productNameService.getById(product.getId(), language).getName());
        return response;
    }

    private ProductQuickSearchResponse toQuickSearchResponse(Product product, Language language) {
        return new ProductQuickSearchResponse(
                product.getId(),
                productNameService.getById(product.getId(), language).getName(),
                product.getModel(),
                product.getSku(),
                product.getBrand() == null
                        ? null
                        : new FeatureDto(product.getBrand().getId(), firstNonBlank(product.getBrand().getName(), product.getBrand().getCode())),
                collectionResponse(product, language),
                productMapper.toIntegerPrice(product.getPrice()),
                product.getStockQuantity(),
                product.getStatus(),
                firstImageUrl(product.getId())
        );
    }

    private CollectionResponse collectionResponse(Product product, Language language) {
        com.shop.vympel.db.entity.features.Collection collection = product.getCollection();
        if (collection == null) {
            return null;
        }

        CollectionResponse response = new CollectionResponse();
        response.setId(collection.getId());
        response.setName(collectionName(collection, language));
        return response;
    }

    private String firstImageUrl(Long productId) {
        return objectStorageService.getFirstLinkByProductId(productId);
    }

    private List<CatalogFilterResponse> wristwatchFilters(Specification<Product> baseSpecification, Language language) {
        List<CatalogFilterResponse> filters = new ArrayList<>();
        List<WatchDetail> watchDetails = watchDetails(baseSpecification);

        filters.add(watchDetailReferenceFilter("mechanism", label("mechanism", language), watchDetails,
                WatchDetail::getMechanism,
                WatchMechanism::getId, mechanism -> mechanismName(mechanism, language),
                value -> watchDetailFilter("mechanism", value), baseSpecification));
        filters.add(watchDetailReferenceFilter("gender", label("gender", language), watchDetails,
                WatchDetail::getGender,
                Gender::getId, gender -> genderName(gender, language),
                value -> watchDetailFilter("gender", value), baseSpecification));
        filters.add(watchDetailReferenceFilter("caseMaterial", label("caseMaterial", language), watchDetails,
                WatchDetail::getCaseMaterial,
                Material::getId, material -> materialName(material, language),
                value -> watchDetailFilter("caseMaterial", value), baseSpecification));
        filters.add(watchDetailReferenceFilter("strapMaterial", label("strapMaterial", language), watchDetails,
                WatchDetail::getStrapMaterial,
                Material::getId, material -> materialName(material, language),
                value -> watchDetailFilter("strapMaterial", value), baseSpecification));
        filters.add(watchDetailReferenceFilter("glassType", label("glassType", language), watchDetails,
                WatchDetail::getGlassType,
                GlassType::getId, glassType -> glassTypeName(glassType, language),
                value -> watchDetailFilter("glassType", value), baseSpecification));
        filters.add(watchDetailReferenceFilter("stoneInlay", label("stoneInlay", language), watchDetails,
                WatchDetail::getStoneInlay,
                StoneInlay::getId, stoneInlay -> stoneInlayName(stoneInlay, language),
                value -> watchDetailFilter("stoneInlay", value), baseSpecification));
        filters.add(caseSizeFilter(baseSpecification, language, watchDetails));

        return filters;
    }

    private List<CatalogFilterResponse> interiorClockFilters(Specification<Product> baseSpecification, Language language) {
        List<CatalogFilterResponse> filters = new ArrayList<>();
        List<InteriorClockDetail> interiorDetails = interiorClockDetails(baseSpecification);

        filters.add(interiorDetailReferenceFilter("interiorCaseMaterial", label("interiorCaseMaterial", language), interiorDetails,
                InteriorClockDetail::getCaseMaterial,
                Material::getId, material -> materialName(material, language),
                value -> interiorDetailFilter("caseMaterial", value), baseSpecification));
        filters.add(interiorDetailReferenceFilter("interiorColor", label("interiorColor", language), interiorDetails,
                InteriorClockDetail::getColor,
                InteriorFeature::getId, feature -> interiorFeatureName(feature, language),
                value -> interiorDetailFilter("color", value), baseSpecification));
        filters.add(interiorDetailReferenceFilter("interiorStyle", label("interiorStyle", language), interiorDetails,
                InteriorClockDetail::getStyle,
                InteriorFeature::getId, feature -> interiorFeatureName(feature, language),
                value -> interiorDetailFilter("style", value), baseSpecification));
        filters.add(interiorDetailReferenceFilter("interiorMechanismType", label("interiorMechanismType", language), interiorDetails,
                InteriorClockDetail::getMechanismType,
                InteriorFeature::getId, feature -> interiorFeatureName(feature, language),
                value -> interiorDetailFilter("mechanismType", value), baseSpecification));
        filters.add(interiorDetailReferenceFilter("powerType", label("powerType", language), interiorDetails,
                InteriorClockDetail::getPowerType,
                InteriorFeature::getId, feature -> interiorFeatureName(feature, language),
                value -> interiorDetailFilter("powerType", value), baseSpecification));

        return filters;
    }

    private Specification<Product> catalogSpecification(CatalogProductQuery query, CatalogCategoryContext context) {
        Specification<Product> specification = baseSpecification(context);

        if (query.getPriceMin() != null) {
            specification = specification.and((root, criteriaQuery, cb) -> cb.greaterThanOrEqualTo(root.get("price"), query.getPriceMin()));
        }

        if (query.getPriceMax() != null) {
            specification = specification.and((root, criteriaQuery, cb) -> cb.lessThanOrEqualTo(root.get("price"), query.getPriceMax()));
        }

        String search = selectedValue(query.getSearch());
        if (search != null) {
            specification = specification.and(searchSpecification(search));
        }

        Map<String, List<String>> filters = selectedFilters(query.getFilters());
        if (!filters.isEmpty()) {
            specification = specification.and(filtersSpecification(filters, context.getProfile()));
        }

        return specification;
    }

    private Specification<Product> baseSpecification(CatalogCategoryContext context) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), "ACTIVE"));

            if (!context.getScopeCategoryIds().isEmpty()) {
                Subquery<Long> subquery = criteriaQuery.subquery(Long.class);
                Root<ProductCategory> productCategory = subquery.from(ProductCategory.class);
                subquery.select(productCategory.get("product").get("id"));
                subquery.where(
                        cb.equal(productCategory.get("product").get("id"), root.get("id")),
                        productCategory.get("category").get("id").in(context.getScopeCategoryIds())
                );
                predicates.add(cb.exists(subquery));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Product> filtersSpecification(Map<String, List<String>> filters, CatalogCategoryProfile profile) {
        Specification<Product> specification = (root, criteriaQuery, cb) -> cb.conjunction();

        specification = andLongFilter(specification, filters, "brand", value -> productFieldFilter("brand", value));

        if (profile == CatalogCategoryProfile.WRISTWATCH) {
            for (Map.Entry<String, String> entry : WRISTWATCH_DETAIL_FILTER_FIELDS.entrySet()) {
                if (filters.containsKey(entry.getKey())) {
                    specification = andLongFilter(specification, filters, entry.getKey(), value -> watchDetailFilter(entry.getValue(), value));
                }
            }
            if (filters.containsKey("caseSize")) {
                specification = andBigDecimalFilter(specification, filters, "caseSize", this::watchCaseSizeFilter);
            }
        }

        if (profile == CatalogCategoryProfile.ACCESSORY && filters.containsKey("gender")) {
            specification = andLongFilter(specification, filters, "gender", value -> watchDetailFilter("gender", value));
        }

        if (profile == CatalogCategoryProfile.INTERIOR_CLOCK) {
            for (Map.Entry<String, String> entry : INTERIOR_DETAIL_FILTER_FIELDS.entrySet()) {
                if (filters.containsKey(entry.getKey())) {
                    specification = andLongFilter(specification, filters, entry.getKey(), value -> interiorDetailFilter(entry.getValue(), value));
                }
            }
        }

        specification = andLongFilter(specification, filters, COUNTRY_FILTER_KEY, this::brandCountryFilter);

        return specification;
    }

    private Specification<Product> andLongFilter(
            Specification<Product> specification,
            Map<String, List<String>> filters,
            String key,
            Function<List<Long>, Specification<Product>> filterFactory
    ) {
        List<Long> values = parseLongValues(filters.get(key));
        return values.isEmpty() ? specification : specification.and(filterFactory.apply(values));
    }

    private Specification<Product> andBigDecimalFilter(
            Specification<Product> specification,
            Map<String, List<String>> filters,
            String key,
            Function<List<BigDecimal>, Specification<Product>> filterFactory
    ) {
        List<BigDecimal> values = parseDecimalValues(filters.get(key));
        return values.isEmpty() ? specification : specification.and(filterFactory.apply(values));
    }

    private Specification<Product> searchSpecification(String rawSearch) {
        String search = rawSearch.trim().toLowerCase(Locale.ROOT);
        String like = "%" + search + "%";

        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.like(cb.lower(root.get("model")), like));
            predicates.add(cb.like(cb.lower(root.get("sku")), like));
            predicates.add(cb.like(cb.lower(root.get("brand").get("name")), like));
            predicates.add(cb.greaterThan(cb.function("similarity", Double.class, cb.lower(root.get("model")), cb.literal(search)), SEARCH_SIMILARITY_THRESHOLD));
            predicates.add(cb.greaterThan(cb.function("similarity", Double.class, cb.lower(root.get("sku")), cb.literal(search)), SEARCH_SIMILARITY_THRESHOLD));
            predicates.add(cb.greaterThan(cb.function("similarity", Double.class, cb.lower(root.get("brand").get("name")), cb.literal(search)), SEARCH_SIMILARITY_THRESHOLD));

            Subquery<Long> nameSubquery = criteriaQuery.subquery(Long.class);
            Root<ProductI18n> productI18n = nameSubquery.from(ProductI18n.class);
            nameSubquery.select(productI18n.get("product").get("id"));
            nameSubquery.where(
                    cb.equal(productI18n.get("product").get("id"), root.get("id")),
                    cb.or(
                            cb.like(cb.lower(productI18n.get("name")), like),
                            cb.greaterThan(cb.function("similarity", Double.class, cb.lower(productI18n.get("name")), cb.literal(search)), SEARCH_SIMILARITY_THRESHOLD)
                    )
            );
            predicates.add(cb.exists(nameSubquery));

            Subquery<Long> collectionSubquery = criteriaQuery.subquery(Long.class);
            Root<com.shop.vympel.db.entity.features.Collection> collection = collectionSubquery.from(com.shop.vympel.db.entity.features.Collection.class);
            collectionSubquery.select(collection.get("id"));
            collectionSubquery.where(
                    cb.equal(collection.get("id"), root.get("collection").get("id")),
                    cb.or(
                            cb.like(cb.lower(collection.get("name")), like),
                            cb.like(cb.lower(collection.get("code")), like),
                            cb.greaterThan(cb.function("similarity", Double.class, cb.lower(collection.get("name")), cb.literal(search)), SEARCH_SIMILARITY_THRESHOLD),
                            cb.greaterThan(cb.function("similarity", Double.class, cb.lower(collection.get("code")), cb.literal(search)), SEARCH_SIMILARITY_THRESHOLD)
                    )
            );
            predicates.add(cb.exists(collectionSubquery));

            return cb.or(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Product> productFieldFilter(String field, List<Long> values) {
        return (root, criteriaQuery, cb) -> root.get(field).get("id").in(values);
    }

    private Specification<Product> brandCountryFilter(List<Long> values) {
        return (root, criteriaQuery, cb) -> {
            Subquery<Long> subquery = criteriaQuery.subquery(Long.class);
            Root<BrandCountry> brandCountry = subquery.from(BrandCountry.class);
            subquery.select(brandCountry.get("brand").get("id"));
            subquery.where(
                    cb.equal(brandCountry.get("brand").get("id"), root.get("brand").get("id")),
                    brandCountry.get("id").get("countryId").in(values)
            );
            return cb.exists(subquery);
        };
    }

    private Specification<Product> watchDetailFilter(String field, List<Long> values) {
        return (root, criteriaQuery, cb) -> {
            Subquery<Long> subquery = criteriaQuery.subquery(Long.class);
            Root<WatchDetail> detail = subquery.from(WatchDetail.class);
            subquery.select(detail.get("product").get("id"));
            subquery.where(
                    cb.equal(detail.get("product").get("id"), root.get("id")),
                    detail.get(field).get("id").in(values)
            );
            return cb.exists(subquery);
        };
    }

    private Specification<Product> watchCaseSizeFilter(List<BigDecimal> values) {
        return (root, criteriaQuery, cb) -> {
            Subquery<Long> subquery = criteriaQuery.subquery(Long.class);
            Root<WatchDetail> detail = subquery.from(WatchDetail.class);
            subquery.select(detail.get("product").get("id"));
            subquery.where(
                    cb.equal(detail.get("product").get("id"), root.get("id")),
                    detail.get("caseSizeMm").in(values)
            );
            return cb.exists(subquery);
        };
    }

    private Specification<Product> interiorDetailFilter(String field, List<Long> values) {
        return (root, criteriaQuery, cb) -> {
            Subquery<Long> subquery = criteriaQuery.subquery(Long.class);
            Root<InteriorClockDetail> detail = subquery.from(InteriorClockDetail.class);
            subquery.select(detail.get("product").get("id"));
            subquery.where(
                    cb.equal(detail.get("product").get("id"), root.get("id")),
                    detail.get(field).get("id").in(values)
            );
            return cb.exists(subquery);
        };
    }

    private CatalogFilterResponse priceFilter(Specification<Product> baseSpecification, Language language) {
        List<Product> products = productRepository.findAll(baseSpecification);

        BigDecimal min = products.stream()
                .map(Product::getPrice)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        BigDecimal max = products.stream()
                .map(Product::getPrice)
                .filter(Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return new CatalogFilterResponse("price", label("price", language), "range", PRODUCT_FILTER_SOURCE, List.of(), min, max);
    }

    private CatalogFilterResponse caseSizeFilter(
            Specification<Product> baseSpecification,
            Language language,
            List<WatchDetail> watchDetails
    ) {
        List<BigDecimal> sizes = watchDetails
                .stream()
                .map(WatchDetail::getCaseSizeMm)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();

        List<CatalogFilterOptionResponse> options = sizes.stream()
                .map(size -> {
                    long count = productRepository.count(baseSpecification.and(watchCaseSizeFilter(List.of(size))));
                    String value = size.stripTrailingZeros().toPlainString();
                    return new CatalogFilterOptionResponse(value, value, count, count == 0);
                })
                .toList();

        return new CatalogFilterResponse("caseSize", label("caseSize", language), "checkbox", WATCH_DETAIL_FILTER_SOURCE, options, null, null);
    }

    private <T> CatalogFilterResponse watchDetailReferenceFilter(
            String key,
            String label,
            List<WatchDetail> watchDetails,
            Function<WatchDetail, T> referenceGetter,
            Function<T, Long> idGetter,
            Function<T, String> nameGetter,
            Function<List<Long>, Specification<Product>> filterFactory,
            Specification<Product> baseSpecification
    ) {
        Map<Long, T> referencesById = new LinkedHashMap<>();

        watchDetails.stream()
                .map(referenceGetter)
                .filter(Objects::nonNull)
                .forEach(reference -> {
                    Long id = idGetter.apply(reference);
                    if (id != null) {
                        referencesById.putIfAbsent(id, reference);
                    }
                });

        return referenceFilter(key, label, WATCH_DETAIL_FILTER_SOURCE, new ArrayList<>(referencesById.values()),
                idGetter, nameGetter, filterFactory, baseSpecification);
    }

    private <T> CatalogFilterResponse interiorDetailReferenceFilter(
            String key,
            String label,
            List<InteriorClockDetail> interiorDetails,
            Function<InteriorClockDetail, T> referenceGetter,
            Function<T, Long> idGetter,
            Function<T, String> nameGetter,
            Function<List<Long>, Specification<Product>> filterFactory,
            Specification<Product> baseSpecification
    ) {
        Map<Long, T> referencesById = new LinkedHashMap<>();

        interiorDetails.stream()
                .map(referenceGetter)
                .filter(Objects::nonNull)
                .forEach(reference -> {
                    Long id = idGetter.apply(reference);
                    if (id != null) {
                        referencesById.putIfAbsent(id, reference);
                    }
                });

        return referenceFilter(key, label, INTERIOR_DETAIL_FILTER_SOURCE, new ArrayList<>(referencesById.values()),
                idGetter, nameGetter, filterFactory, baseSpecification);
    }

    private List<WatchDetail> watchDetails(Specification<Product> baseSpecification) {
        List<Long> productIds = productRepository.findAll(baseSpecification)
                .stream()
                .map(Product::getId)
                .distinct()
                .toList();

        return productIds.isEmpty() ? List.of() : watchDetailRepository.findAllById(productIds);
    }

    private List<InteriorClockDetail> interiorClockDetails(Specification<Product> baseSpecification) {
        List<Long> productIds = productRepository.findAll(baseSpecification)
                .stream()
                .map(Product::getId)
                .distinct()
                .toList();

        return productIds.isEmpty() ? List.of() : interiorClockDetailRepository.findAllById(productIds);
    }

    private <T> CatalogFilterResponse referenceFilter(
            String key,
            String label,
            String source,
            List<T> references,
            Function<T, Long> idGetter,
            Function<T, String> nameGetter,
            Function<List<Long>, Specification<Product>> filterFactory,
            Specification<Product> baseSpecification
    ) {
        List<CatalogFilterOptionResponse> options = references.stream()
                .map(reference -> {
                    Long id = idGetter.apply(reference);
                    long count = productRepository.count(baseSpecification.and(filterFactory.apply(List.of(id))));
                    return new CatalogFilterOptionResponse(String.valueOf(id), nameGetter.apply(reference), count, count == 0);
                })
                .sorted(Comparator.comparing(CatalogFilterOptionResponse::getLabel))
                .toList();

        return new CatalogFilterResponse(key, label, "checkbox", source, options, null, null);
    }

    private CatalogCategoryContextResponse categoryContextResponse(CatalogCategoryContext context, Language language) {
        if (context.getCategory() == null) {
            return new CatalogCategoryContextResponse(null, null, label("allProducts", language), null, null);
        }

        String parentSlug = Optional.ofNullable(context.getCategory().getParent())
                .map(Category::getCode)
                .map(this::slug)
                .orElse(null);

        return new CatalogCategoryContextResponse(
                context.getCategory().getId(),
                slug(context.getCategory().getCode()),
                context.getCategory().getCode(),
                parentSlug,
                context.getInheritsFiltersFrom()
        );
    }

    private List<Country> activeCountries() {
        return countryRepository.findAll()
                .stream()
                .filter(country -> Boolean.TRUE.equals(country.getActive()))
                .toList();
    }

    private List<Long> parseLongValues(List<String> rawValues) {
        if (rawValues == null) return List.of();

        return selectedValues(rawValues).stream()
                .map(value -> {
                    try {
                        return Long.valueOf(value);
                    } catch (NumberFormatException ignored) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private List<BigDecimal> parseDecimalValues(List<String> rawValues) {
        if (rawValues == null) return List.of();

        return selectedValues(rawValues).stream()
                .map(value -> {
                    try {
                        return new BigDecimal(value);
                    } catch (NumberFormatException ignored) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private Map<String, List<String>> selectedFilters(Map<String, List<String>> filters) {
        if (filters == null || filters.isEmpty()) {
            return Map.of();
        }

        Map<String, List<String>> selected = new LinkedHashMap<>();
        filters.forEach((key, rawValues) -> {
            String selectedKey = selectedValue(key);
            List<String> selectedValues = selectedValues(rawValues);
            if (selectedKey != null && !selectedValues.isEmpty()) {
                selected.put(selectedKey, selectedValues);
            }
        });

        return selected;
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

    private String label(String key, Language language) {
        return switch (language) {
            case EN -> switch (key) {
                case "price" -> "Price";
                case "brand" -> "Brand";
                case "country" -> "Country";
                case "mechanism" -> "Mechanism";
                case "gender" -> "Gender";
                case "caseMaterial" -> "Case";
                case "strapMaterial" -> "Bracelet";
                case "glassType" -> "Glass";
                case "stoneInlay" -> "Stone";
                case "caseSize" -> "Case size";
                case "productionCountry" -> "Country";
                case "interiorCaseMaterial" -> "Case material";
                case "interiorColor" -> "Color";
                case "interiorStyle" -> "Style";
                case "interiorMechanismType" -> "Mechanism";
                case "powerType" -> "Power type";
                case "allProducts" -> "All products";
                default -> key;
            };
            case KZ -> switch (key) {
                case "price" -> "Баға";
                case "brand" -> "Бренд";
                case "country" -> "Ел";
                case "mechanism" -> "Механизм";
                case "gender" -> "Жынысы";
                case "caseMaterial" -> "Корпус";
                case "strapMaterial" -> "Білезік";
                case "glassType" -> "Әйнек";
                case "stoneInlay" -> "Тас";
                case "caseSize" -> "Корпус өлшемі";
                case "productionCountry" -> "Ел";
                case "interiorCaseMaterial" -> "Корпус материалы";
                case "interiorColor" -> "Түс";
                case "interiorStyle" -> "Стиль";
                case "interiorMechanismType" -> "Механизм";
                case "powerType" -> "Қуат түрі";
                case "allProducts" -> "Барлық тауарлар";
                default -> key;
            };
            case RU -> switch (key) {
                case "price" -> "Цена";
                case "brand" -> "Бренд";
                case "country" -> "Страна";
                case "mechanism" -> "Механизм";
                case "gender" -> "Пол";
                case "caseMaterial" -> "Корпус";
                case "strapMaterial" -> "Браслет";
                case "glassType" -> "Стекло";
                case "stoneInlay" -> "Камень-вставка";
                case "caseSize" -> "Размер корпуса";
                case "productionCountry" -> "Страна";
                case "interiorCaseMaterial" -> "Материал корпуса";
                case "interiorColor" -> "Цвет";
                case "interiorStyle" -> "Стиль";
                case "interiorMechanismType" -> "Механизм";
                case "powerType" -> "Тип питания";
                case "allProducts" -> "Все товары";
                default -> key;
            };
        };
    }

    private String mechanismName(WatchMechanism mechanism, Language language) {
        WatchMechanismI18nId id = new WatchMechanismI18nId();
        id.setMechanismId(mechanism.getId());
        id.setLang(language.getValue());
        return translatedName(mechanismI18nRepository, id, mechanism.getCode());
    }

    private String genderName(Gender gender, Language language) {
        GenderI18nId id = new GenderI18nId();
        id.setGenderId(gender.getId());
        id.setLang(language.getValue());
        return translatedName(genderI18nRepository, id, gender.getCode());
    }

    private String materialName(Material material, Language language) {
        MaterialI18nId id = new MaterialI18nId();
        id.setMaterialId(material.getId());
        id.setLang(language.getValue());
        return translatedName(materialI18nRepository, id, material.getCode());
    }

    private String glassTypeName(GlassType glassType, Language language) {
        GlassTypeI18nId id = new GlassTypeI18nId();
        id.setGlassTypeId(glassType.getId());
        id.setLang(language.getValue());
        return translatedName(glassTypeI18nRepository, id, glassType.getCode());
    }

    private String stoneInlayName(StoneInlay stoneInlay, Language language) {
        StoneInlayI18nId id = new StoneInlayI18nId();
        id.setStoneInlayId(stoneInlay.getId());
        id.setLang(language.getValue());
        return translatedName(stoneInlayI18nRepository, id, stoneInlay.getCode());
    }

    private String countryName(Country country, Language language) {
        CountryI18nId id = new CountryI18nId();
        id.setCountryId(country.getId());
        id.setLang(language.getValue());
        return countryI18nRepository.findById(id)
                .map(CountryI18n::getName)
                .orElse(country.getCode());
    }

    private String interiorFeatureName(InteriorFeature feature, Language language) {
        InteriorFeatureI18nId id = new InteriorFeatureI18nId();
        id.setFeatureId(feature.getId());
        id.setLang(language.getValue());
        return translatedName(interiorFeatureI18nRepository, id, feature.getCode());
    }

    private <T extends EntityI18n, ID extends EmbeddableId> String translatedName(
            JpaRepository<T, ID> repository,
            ID id,
            String fallback
    ) {
        return repository.findById(id)
                .map(EntityI18n::getName)
                .orElse(fallback);
    }

    private String firstNonBlank(String primary, String fallback) {
        return primary == null || primary.isBlank() ? fallback : primary;
    }

    private String collectionName(com.shop.vympel.db.entity.features.Collection collection, Language language) {
        CollectionI18nId id = new CollectionI18nId();
        id.setCollectionId(collection.getId());
        id.setLang(language.getValue());

        CollectionI18nId fallbackId = new CollectionI18nId();
        fallbackId.setCollectionId(collection.getId());
        fallbackId.setLang(Language.RU.getValue());

        return collectionI18nRepository.findById(id)
                .or(() -> collectionI18nRepository.findById(fallbackId))
                .map(CollectionI18n::getName)
                .orElse(firstNonBlank(collection.getName(), collection.getCode()));
    }

    private String slug(String code) {
        return code == null ? null : code.toLowerCase(Locale.ROOT).replace('_', '-');
    }
}
