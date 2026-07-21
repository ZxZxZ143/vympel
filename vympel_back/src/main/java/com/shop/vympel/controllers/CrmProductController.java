package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.ProductMarketplaceLinksRequest;
import com.shop.vympel.dtos.crm.ProductStatusUpdateRequest;
import com.shop.vympel.dtos.crm.QuickPriceUpdateRequest;
import com.shop.vympel.dtos.crm.QuickStockUpdateRequest;
import com.shop.vympel.dtos.product.ProductBulkCreateRequest;
import com.shop.vympel.dtos.product.ProductBulkCreateResponse;
import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.dtos.product.ProductUpdateRequest;
import com.shop.vympel.dtos.product.image.ProductImageOrderRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.product.ProductBulkCreationService;
import com.shop.vympel.services.product.ProductService;
import com.shop.vympel.utils.PageableUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/products")
@RequiredArgsConstructor
public class CrmProductController {
    private static final int CRM_PAGE_MAX_SIZE = 100;

    private final ProductService productService;
    private final ProductBulkCreationService productBulkCreationService;
    private final CrmActivityService crmActivityService;
    private final ObjectStorageService objectStorageService;

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(defaultValue = "ru") String lang,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(productService.getAllForCrm(
                        PageableUtils.cap(pageable, CRM_PAGE_MAX_SIZE),
                        Language.from(lang),
                        search,
                        status
                ));
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(
            @PathVariable Long id,
            @RequestParam(defaultValue = "ru") String lang
    ) {
        return productService.get(id, Language.from(lang));
    }

    @PostMapping
    public ProductResponse createProduct(
            @RequestBody @Valid ProductCreateRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        Long id = productService.create(req);
        ProductResponse product = productService.get(id, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_CREATED",
                "PRODUCT",
                id,
                metadata("model", product.getModel(), "sku", product.getSku()),
                request
        );

        return product;
    }

    @PostMapping("/bulk")
    public ProductBulkCreateResponse createProductsBulk(
            @RequestBody @Valid ProductBulkCreateRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductBulkCreateResponse result = productBulkCreationService.createBulk(req, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_BULK_CREATED",
                "PRODUCT",
                null,
                metadata("createdCount", result.createdCount(), "failedCount", result.failedCount()),
                request
        );

        return result;
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(
            @PathVariable Long id,
            @RequestBody @Valid ProductUpdateRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductResponse product = productService.update(id, req, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_EDITED",
                "PRODUCT",
                id,
                metadata("model", product.getModel(), "sku", product.getSku()),
                request
        );

        return product;
    }

    @DeleteMapping("/{id}")
    public ProductResponse archiveProduct(
            @PathVariable Long id,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductResponse product = productService.archive(id, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_ARCHIVED",
                "PRODUCT",
                id,
                metadata("status", product.getStatus()),
                request
        );

        return product;
    }

    @PatchMapping("/{id}/price")
    public ProductResponse updatePrice(
            @PathVariable Long id,
            @RequestBody @Valid QuickPriceUpdateRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductResponse product = productService.updatePrice(id, req.price(), Language.from(lang));

        crmActivityService.log(
                "PRODUCT_PRICE_CHANGED",
                "PRODUCT",
                id,
                metadata("price", product.getPrice()),
                request
        );

        return product;
    }

    @PatchMapping("/{id}/stock")
    public ProductResponse updateStock(
            @PathVariable Long id,
            @RequestBody @Valid QuickStockUpdateRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductResponse product = productService.updateStock(id, req.stockQuantity(), Language.from(lang));

        crmActivityService.log(
                "PRODUCT_STOCK_CHANGED",
                "PRODUCT",
                id,
                metadata("stockQuantity", product.getStockQuantity()),
                request
        );

        return product;
    }

    @PatchMapping("/{id}/status")
    public ProductResponse updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid ProductStatusUpdateRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductResponse product = productService.updateStatus(id, req.status(), Language.from(lang));

        crmActivityService.log(
                "PRODUCT_STATUS_CHANGED",
                "PRODUCT",
                id,
                metadata("status", product.getStatus()),
                request
        );

        return product;
    }

    @PatchMapping("/{id}/marketplace-links")
    public ProductResponse updateMarketplaceLinks(
            @PathVariable Long id,
            @RequestBody @Valid ProductMarketplaceLinksRequest req,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        ProductResponse product = productService.updateMarketplaceLinks(
                id,
                req.kaspiUrl(),
                req.wildberriesUrl(),
                Language.from(lang)
        );

        crmActivityService.log(
                "PRODUCT_MARKETPLACE_LINKS_CHANGED",
                "PRODUCT",
                id,
                metadata(
                        "hasKaspiUrl", product.getKaspiUrl() != null,
                        "hasWildberriesUrl", product.getWildberriesUrl() != null
                ),
                request
        );

        return product;
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductResponse uploadImages(
            @PathVariable Long id,
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) throws IOException {
        List<String> keys = objectStorageService.uploadProductImage(files, id);
        ProductResponse product = productService.get(id, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_IMAGES_UPLOADED",
                "PRODUCT",
                id,
                metadata("count", keys.size()),
                request
        );

        return product;
    }

    @PatchMapping("/{id}/images/order")
    public ProductResponse reorderImages(
            @PathVariable Long id,
            @RequestBody @Valid ProductImageOrderRequest body,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        objectStorageService.reorderProductImages(id, body.imageIds());
        ProductResponse product = productService.get(id, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_IMAGES_REORDERED",
                "PRODUCT",
                id,
                metadata("count", body.imageIds().size()),
                request
        );

        return product;
    }

    @PatchMapping("/{id}/images/{imageId}/main")
    public ProductResponse setMainImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        objectStorageService.setMainProductImage(id, imageId);
        ProductResponse product = productService.get(id, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_MAIN_IMAGE_CHANGED",
                "PRODUCT",
                id,
                metadata("imageId", imageId),
                request
        );

        return product;
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ProductResponse deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        objectStorageService.deleteProductImage(id, imageId);
        ProductResponse product = productService.get(id, Language.from(lang));

        crmActivityService.log(
                "PRODUCT_IMAGE_DELETED",
                "PRODUCT",
                id,
                metadata("imageId", imageId),
                request
        );

        return product;
    }

    private Map<String, Object> metadata(Object... values) {
        Map<String, Object> metadata = new HashMap<>();
        for (int index = 0; index + 1 < values.length; index += 2) {
            metadata.put(String.valueOf(values[index]), values[index + 1]);
        }
        return metadata;
    }
}
