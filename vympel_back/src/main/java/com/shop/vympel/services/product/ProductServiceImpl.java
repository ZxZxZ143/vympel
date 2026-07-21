package com.shop.vympel.services.product;

import com.shop.vympel.db.entity.product.*;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.product.ProductUpdateRequest;
import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.enums.ProductPromotionMode;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.mappers.product.EntityReferenceMapper;
import com.shop.vympel.mappers.product.ProductMapper;
import com.shop.vympel.services.categoryProduct.CategoryProductService;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.catalog.CatalogCategoryProfileService;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.productDescription.ProductDescriptionService;
import com.shop.vympel.services.productName.ProductNameService;
import com.shop.vympel.services.review.ProductReviewService;
import com.shop.vympel.services.watchDetail.InteriorClockDetailServiceImpl;
import com.shop.vympel.services.watchDetail.WatchDetailServiceImpl;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.Set;


@Service
@AllArgsConstructor
public class ProductServiceImpl implements ProductService {
    private static final Set<String> ALLOWED_PRODUCT_STATUSES = Set.of("ACTIVE", "DRAFT", "ARCHIVED");

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final EntityReferenceMapper entityReferenceMapper;
    private final SKUService SKUService;
    private final WatchDetailServiceImpl watchDetailService;
    private final InteriorClockDetailServiceImpl interiorClockDetailService;
    private final CatalogCategoryProfileService catalogCategoryProfileService;
    private final ProductDescriptionService productDescriptionService;
    private final ProductNameService productNameService;
    private final CategoryProductService categoryProductService;
    private final ObjectStorageService objectStorageService;
    private final ProductReviewService productReviewService;

    @Override
    @Transactional
    public Long create(ProductCreateRequest req) throws IllegalArgumentException {
        CatalogCategoryProfile categoryProfile = catalogCategoryProfileService.profileForCategoryId(req.getCategoryId());
        validateProductNameTranslations(req.getProductName());
        validateCreateDetails(req, categoryProfile);
        normalizeProductNameTranslations(req.getProductName());
        req.setStatus(normalizeProductStatus(req.getStatus()));
        ensureStatusCanBePersisted(null, req.getStatus());

        String sku = SKUService.skuGen(req);
        Product product = productRepository.findProductBySku(sku).orElse(null);

        if (product != null) throw new IllegalArgumentException("Product already exists");

        req.setKaspiUrl(normalizeOptionalHttpUrl(req.getKaspiUrl(), "kaspiUrl"));
        req.setWildberriesUrl(normalizeOptionalHttpUrl(req.getWildberriesUrl(), "wildberriesUrl"));
        if (req.getStockQuantity() == null) {
            req.setStockQuantity(0);
        }

        Product newProduct = productMapper.toEntity(req, entityReferenceMapper);
        newProduct.setSku(sku);

        newProduct = productRepository.save(newProduct);

        categoryProductService.linkWithProduct(req.getCategoryId(), newProduct);

        createProfileDetails(req, newProduct, categoryProfile);

        productDescriptionService.addProductDescription(
                newProduct,
                Language.RU,
                localizedDescriptionRequest(req.getDescription(), Language.RU)
        );
        productDescriptionService.addProductDescription(
                newProduct,
                Language.EN,
                localizedDescriptionRequest(req.getDescription(), Language.EN)
        );
        productDescriptionService.addProductDescription(
                newProduct,
                Language.KZ,
                localizedDescriptionRequest(req.getDescription(), Language.KZ)
        );

        productNameService.createProductName(newProduct, Language.RU, nameForLanguage(req.getProductName(), Language.RU));
        productNameService.createProductName(newProduct, Language.EN, nameForLanguage(req.getProductName(), Language.EN));
        productNameService.createProductName(newProduct, Language.KZ, nameForLanguage(req.getProductName(), Language.KZ));

        return newProduct.getId();
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, ProductUpdateRequest req, Language language) {
        Product product = productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Long currentCategoryId = currentCategoryId(product.getId(), language);
        Long targetCategoryId = req.getCategoryId() == null ? currentCategoryId : req.getCategoryId();
        CatalogCategoryProfile currentCategoryProfile = catalogCategoryProfileService.profileForCategoryId(currentCategoryId);
        CatalogCategoryProfile targetCategoryProfile = catalogCategoryProfileService.profileForCategoryId(targetCategoryId);

        if (req.getProductName() != null) {
            validateProductNameTranslations(req.getProductName());
            normalizeProductNameTranslations(req.getProductName());
        }
        if (req.getStatus() != null) {
            req.setStatus(normalizeProductStatus(req.getStatus()));
        }

        validateCategoryProfileChange(currentCategoryId, targetCategoryId, currentCategoryProfile, targetCategoryProfile);
        validateUpdateDetails(req, product, language, targetCategoryProfile);

        String kaspiUrl = req.getKaspiUrl();
        String wildberriesUrl = req.getWildberriesUrl();

        productMapper.updateEntity(product, req, entityReferenceMapper);
        ensureStatusCanBePersisted(product.getId(), product.getStatus());

        if (kaspiUrl != null) {
            product.setKaspiUrl(normalizeOptionalHttpUrl(kaspiUrl, "kaspiUrl"));
        }

        if (wildberriesUrl != null) {
            product.setWildberriesUrl(normalizeOptionalHttpUrl(wildberriesUrl, "wildberriesUrl"));
        }

        Product savedProduct = productRepository.save(product);

        if (req.getCategoryId() != null) {
            categoryProductService.relinkWithProduct(req.getCategoryId(), savedProduct);
        }

        updateProfileDetails(req, savedProduct, targetCategoryProfile);

        if (req.getDescription() != null) {
            productDescriptionService.addProductDescription(
                    savedProduct,
                    Language.RU,
                    localizedDescriptionRequest(req.getDescription(), Language.RU)
            );
            productDescriptionService.addProductDescription(
                    savedProduct,
                    Language.EN,
                    localizedDescriptionRequest(req.getDescription(), Language.EN)
            );
            productDescriptionService.addProductDescription(
                    savedProduct,
                    Language.KZ,
                    localizedDescriptionRequest(req.getDescription(), Language.KZ)
            );
        }

        if (req.getProductName() != null) {
            productNameService.createProductName(savedProduct, Language.RU, nameForLanguage(req.getProductName(), Language.RU));
            productNameService.createProductName(savedProduct, Language.EN, nameForLanguage(req.getProductName(), Language.EN));
            productNameService.createProductName(savedProduct, Language.KZ, nameForLanguage(req.getProductName(), Language.KZ));
        }

        return get(savedProduct.getId(), language);
    }

    @Override
    @Transactional
    public Boolean delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        productRepository.delete(product);

        return true;
    }

    @Override
    public ProductResponse get(Long id, Language language) throws IllegalArgumentException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        ProductResponse productResponse = productMapper.toResponse(product, language);
        applyCanonicalInventoryFields(product, productResponse);

        productResponse.setWatchDetails(watchDetailService.getWatchDetailByIdOrNull(product.getId(), language));
        productResponse.setInteriorClockDetails(
                interiorClockDetailService.getInteriorClockDetailByIdOrNull(product.getId(), language)
        );

        productResponse.setDescription(
                productDescriptionService
                        .getDescriptionContentById(
                                productDescriptionService.getDescriptionById(product.getId()).getId(),
                                language
                        )
        );
        productResponse.setDescriptionTranslations(
                productDescriptionService.getDescriptionTranslationsByProductId(product.getId())
        );

        productResponse.setName(
                productNameService.getById(
                        product.getId(),
                        language
                ).getName()
        );
        productResponse.setProductName(productNameService.getTranslationsByProductId(product.getId()));

        productResponse.setCategory(
                categoryProductService.getByProductId(product.getId(), language)
        );

        productResponse.setImages(
                objectStorageService.getProductImages(product.getId())
        );
        productReviewService.applyRatingSummary(productResponse);

        return productResponse;
    }

    @Override
    public Page<ProductShortResponse> getAll(Pageable pageable, Language language, Long categoryId) {
        return addNameAndImageToProductResponse(
                categoryProductService
                        .getAllByCategoryId(categoryId, pageable),
                language
        );
    }

    @Override
    public Page<ProductShortResponse> getAllByCategoryCode(Pageable pageable, Language language, String categoryCode) {
        return addNameAndImageToProductResponse(
                categoryProductService
                        .getAllByCategoryCode(categoryCode, pageable),
                language
        );
    }

    private Page<ProductShortResponse> addNameAndImageToProductResponse(Page<ProductShortResponse> productResponse, Language language) {
        productResponse
                .getContent()
                .forEach(product -> {
                    product.setImageUrl(
                            objectStorageService.getFirstLinkByProductId(product.getId())
                    );

                    product.setName(
                            productNameService.getById(
                                    product.getId(),
                                    language
                            ).getName()
                    );
                });
        productReviewService.applyRatingSummaries(productResponse.getContent());

        return productResponse;
    }

    @Override
    @Transactional
    public Page<ProductResponse> getAllForCrm(
            Pageable pageable,
            Language language,
            String search,
            String status
    ) {
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        String normalizedStatus = status == null || status.isBlank()
                ? null
                : normalizeProductStatus(status);

        if (normalizedSearch == null) {
            Page<Product> products = normalizedStatus == null
                    ? productRepository.findAll(pageable)
                    : productRepository.findAllByStatusIgnoreCase(normalizedStatus, pageable);
            return products.map(product -> get(product.getId(), language));
        }

        Page<Product> products = normalizedStatus == null
                ? productRepository.searchForCrm(normalizedSearch, pageable)
                : productRepository.searchForCrmByStatus(normalizedSearch, normalizedStatus, pageable);
        return products.map(product -> get(product.getId(), language));
    }

    @Override
    @Transactional
    public ProductResponse updatePrice(Long id, Integer price, Language language) {
        if (price == null || price < 0) {
            throw new IllegalArgumentException("Price must be non-negative");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setPrice(java.math.BigDecimal.valueOf(price));

        productRepository.save(product);

        return get(id, language);
    }

    @Override
    @Transactional
    public ProductResponse updateStock(Long id, Integer stockQuantity, Language language) {
        if (stockQuantity == null || stockQuantity < 0) {
            throw new IllegalArgumentException("Stock quantity must be non-negative");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setStockQuantity(stockQuantity);

        productRepository.save(product);

        return get(id, language);
    }

    @Override
    @Transactional
    public ProductResponse updateStatus(Long id, String status, Language language) {
        String normalizedStatus = normalizeProductStatus(status);

        Product product = productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        ensureStatusCanBePersisted(product.getId(), normalizedStatus);
        product.setStatus(normalizedStatus);

        productRepository.save(product);

        return get(id, language);
    }

    @Override
    @Transactional
    public ProductResponse updateMarketplaceLinks(Long id, String kaspiUrl, String wildberriesUrl, Language language) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        product.setKaspiUrl(normalizeOptionalHttpUrl(kaspiUrl, "kaspiUrl"));
        product.setWildberriesUrl(normalizeOptionalHttpUrl(wildberriesUrl, "wildberriesUrl"));

        productRepository.save(product);

        return get(id, language);
    }

    @Override
    @Transactional
    public ProductResponse updatePromotion(Long id, String promotionMode, Language language) {
        ProductPromotionMode mode = parsePromotionMode(promotionMode);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (mode != ProductPromotionMode.NOT_PROMOTED
                && (product.getStockQuantity() == null || product.getStockQuantity() <= 0)) {
            throw new IllegalArgumentException("Out-of-stock products cannot be promoted");
        }

        product.setPromotionMode(mode.name());
        product.setPromotionScore(defaultPromotionScore(mode));
        product.setPromotionUpdatedAt(Instant.now());
        if (mode == ProductPromotionMode.NOT_PROMOTED) {
            product.setPromotedUntil(null);
        }

        productRepository.save(product);

        return get(id, language);
    }

    @Override
    @Transactional
    public ProductResponse archive(Long id, Language language) {
        return updateStatus(id, "ARCHIVED", language);
    }

    private String normalizeOptionalHttpUrl(String url, String fieldName) {
        if (url == null) {
            return null;
        }

        String trimmed = url.trim();
        if (trimmed.isBlank()) {
            return null;
        }

        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme();
            String host = uri.getHost();

            if (scheme == null || host == null || host.isBlank()) {
                throw new IllegalArgumentException(fieldName + " must be a valid URL");
            }

            String normalizedScheme = scheme.toLowerCase();
            if (!normalizedScheme.equals("http") && !normalizedScheme.equals("https")) {
                throw new IllegalArgumentException(fieldName + " must use http or https");
            }

            return uri.toString();
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException(fieldName + " must be a valid URL");
        }
    }

    private ProductPromotionMode parsePromotionMode(String promotionMode) {
        if (promotionMode == null || promotionMode.isBlank()) {
            throw new IllegalArgumentException("promotionMode is required");
        }

        try {
            return ProductPromotionMode.valueOf(promotionMode.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported promotionMode");
        }
    }

    private String normalizeProductStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();
        if (!ALLOWED_PRODUCT_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Unsupported product status");
        }

        return normalizedStatus;
    }

    private void ensureStatusCanBePersisted(Long productId, String status) {
        if (!"ACTIVE".equals(status)) {
            return;
        }
        if (productId == null || !objectStorageService.hasRequiredMainProductImage(productId)) {
            throw new BusinessRuleViolationException(
                    "PRODUCT_MAIN_IMAGE_REQUIRED",
                    "A main image is required before a product can be activated."
            );
        }
    }

    private BigDecimal defaultPromotionScore(ProductPromotionMode mode) {
        return switch (mode) {
            case MANUAL -> BigDecimal.valueOf(100);
            case AUTO -> BigDecimal.valueOf(75);
            case NOT_PROMOTED -> BigDecimal.ZERO;
        };
    }

    private void validateCreateDetails(ProductCreateRequest req, CatalogCategoryProfile profile) {
        validateUnexpectedDetails(profile, req.getWatchDetails() != null, req.getInteriorClockDetails() != null);
    }

    private void validateUpdateDetails(
            ProductUpdateRequest req,
            Product product,
            Language language,
            CatalogCategoryProfile profile
    ) {
        validateUnexpectedDetails(profile, req.getWatchDetails() != null, req.getInteriorClockDetails() != null);

    }

    private void validateUnexpectedDetails(
            CatalogCategoryProfile profile,
            boolean hasWatchDetails,
            boolean hasInteriorClockDetails
    ) {
        if (profile != CatalogCategoryProfile.WRISTWATCH && hasWatchDetails) {
            throw new IllegalArgumentException("watchDetails are allowed only for wristwatch categories");
        }

        if (profile != CatalogCategoryProfile.INTERIOR_CLOCK && hasInteriorClockDetails) {
            throw new IllegalArgumentException("interiorClockDetails are allowed only for interior clock categories");
        }
    }

    private void validateCategoryProfileChange(
            Long currentCategoryId,
            Long targetCategoryId,
            CatalogCategoryProfile currentProfile,
            CatalogCategoryProfile targetProfile
    ) {
        if (!Objects.equals(currentCategoryId, targetCategoryId) && currentProfile != targetProfile) {
            throw new IllegalArgumentException("Changing product category across detail profiles is not supported");
        }
    }

    private void createProfileDetails(ProductCreateRequest req, Product product, CatalogCategoryProfile profile) {
        if (profile == CatalogCategoryProfile.WRISTWATCH && req.getWatchDetails() != null) {
            watchDetailService.create(req.getWatchDetails(), product);
            return;
        }

        if (profile == CatalogCategoryProfile.INTERIOR_CLOCK && req.getInteriorClockDetails() != null) {
            interiorClockDetailService.create(req.getInteriorClockDetails(), product);
        }
    }

    private void updateProfileDetails(
            ProductUpdateRequest req,
            Product product,
            CatalogCategoryProfile profile
    ) {
        if (profile == CatalogCategoryProfile.WRISTWATCH && req.getWatchDetails() != null) {
            watchDetailService.update(req.getWatchDetails(), product);
        }

        if (profile == CatalogCategoryProfile.INTERIOR_CLOCK && req.getInteriorClockDetails() != null) {
            interiorClockDetailService.update(req.getInteriorClockDetails(), product);
        }
    }

    private void applyCanonicalInventoryFields(Product product, ProductResponse productResponse) {
        productResponse.setPrice(toIntegerPrice(product.getPrice()));
        productResponse.setStockQuantity(product.getStockQuantity());
    }

    private Integer toIntegerPrice(BigDecimal price) {
        return price == null ? null : price.intValue();
    }

    private void validateProductNameTranslations(ProductNameCreateRequest productName) {
        if (productName == null
                || isBlank(productName.getName_ru())) {
            throw new IllegalArgumentException("Product name is required in ru");
        }
    }

    private void normalizeProductNameTranslations(ProductNameCreateRequest productName) {
        String fallbackName = productName.getName_ru().trim();
        productName.setName_ru(fallbackName);
        productName.setName_en(firstNonBlank(productName.getName_en(), fallbackName));
        productName.setName_kz(firstNonBlank(productName.getName_kz(), fallbackName));
    }

    private String nameForLanguage(ProductNameCreateRequest productName, Language language) {
        return switch (language) {
            case RU -> productName.getName_ru();
            case EN -> firstNonBlank(productName.getName_en(), productName.getName_ru());
            case KZ -> firstNonBlank(productName.getName_kz(), productName.getName_ru());
        };
    }

    private DescriptionCreateRequest localizedDescriptionRequest(
            DescriptionCreateRequest description,
            Language language
    ) {
        return new DescriptionCreateRequest(descriptionForLanguage(description, language));
    }

    private String descriptionForLanguage(DescriptionCreateRequest description, Language language) {
        if (description == null) {
            return "";
        }
        String fallbackDescription = firstNonBlank(description.getDescRu(), description.getDesc());
        fallbackDescription = fallbackDescription == null ? "" : fallbackDescription;
        return switch (language) {
            case RU -> fallbackDescription;
            case EN -> firstNonBlank(description.getDescEn(), fallbackDescription);
            case KZ -> firstNonBlank(description.getDescKz(), fallbackDescription);
        };
    }

    private String firstNonBlank(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private Long currentCategoryId(Long productId, Language language) {
        Integer categoryId = categoryProductService.getByProductId(productId, language).getId();
        return categoryId == null ? null : categoryId.longValue();
    }
}
