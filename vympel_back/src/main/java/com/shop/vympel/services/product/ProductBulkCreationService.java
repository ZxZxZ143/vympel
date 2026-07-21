package com.shop.vympel.services.product;

import com.shop.vympel.dtos.product.*;
import com.shop.vympel.dtos.product.details.InteriorClockDetailCreateRequest;
import com.shop.vympel.dtos.product.details.InteriorClockDetailUpdateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailUpdateRequest;
import com.shop.vympel.enums.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductBulkCreationService {
    private final ProductService productService;

    public ProductBulkCreateResponse createBulk(ProductBulkCreateRequest request, Language language) {
        List<ProductBulkCreatedProductResponse> created = new ArrayList<>();
        List<ProductBulkErrorResponse> errors = new ArrayList<>();

        List<ProductBulkRowRequest> rows = request.getRows() == null ? List.of() : request.getRows();
        for (int index = 0; index < rows.size(); index++) {
            ProductBulkRowRequest row = rows.get(index);
            String validationError = validateRow(row);
            if (validationError != null) {
                errors.add(new ProductBulkErrorResponse(index, "row", validationError));
                continue;
            }

            try {
                ProductCreateRequest createRequest = toCreateRequest(request, row);
                Long productId = productService.create(createRequest);
                ProductResponse product = productService.get(productId, language);
                created.add(new ProductBulkCreatedProductResponse(index, product.getId(), product.getSku()));
            } catch (Exception ex) {
                errors.add(new ProductBulkErrorResponse(index, "row", ex.getMessage()));
            }
        }

        return new ProductBulkCreateResponse(
                created.size(),
                errors.size(),
                created,
                errors
        );
    }

    private ProductCreateRequest toCreateRequest(ProductBulkCreateRequest request, ProductBulkRowRequest row) {
        ProductBulkCommonRequest common = request.getCommon();
        ProductCreateRequest product = new ProductCreateRequest();
        product.setProductName(row.getProductName());
        product.setModel(row.getModel());
        product.setPrice(row.getPrice());
        product.setStockQuantity(row.getStockQuantity());
        product.setStatus(firstNonBlank(row.getStatus(), common.getStatus()));
        product.setProductType(firstNonBlank(row.getProductType(), common.getProductType()));
        product.setBrandId(firstNonNull(row.getBrandId(), common.getBrandId()));
        product.setCollectionId(firstNonNull(row.getCollectionId(), common.getCollectionId()));
        product.setCategoryId(request.getCategoryId());
        product.setDescription(firstNonNull(row.getDescription(), common.getDescription()));
        product.setWatchDetails(mergeWatchDetails(common.getWatchDetails(), row.getWatchDetails()));
        product.setInteriorClockDetails(mergeInteriorClockDetails(
                common.getInteriorClockDetails(),
                row.getInteriorClockDetails()
        ));
        product.setKaspiUrl(firstNonBlank(row.getKaspiUrl(), common.getKaspiUrl()));
        product.setWildberriesUrl(firstNonBlank(row.getWildberriesUrl(), common.getWildberriesUrl()));
        return product;
    }

    private String validateRow(ProductBulkRowRequest row) {
        if (row == null) {
            return "Row is required";
        }

        if (row.getProductName() == null
                || isBlank(row.getProductName().getName_ru())) {
            return "Product name is required in ru";
        }

        if (isBlank(row.getModel())) {
            return "Model is required";
        }

        if (row.getPrice() == null || row.getPrice() < 0) {
            return "Price must be non-negative";
        }

        if (row.getStockQuantity() == null || row.getStockQuantity() < 0) {
            return "Stock quantity must be non-negative";
        }

        return null;
    }

    private String firstNonBlank(String primary, String fallback) {
        return isBlank(primary) ? fallback : primary;
    }

    private <T> T firstNonNull(T primary, T fallback) {
        return primary == null ? fallback : primary;
    }

    private WatchDetailCreateRequest mergeWatchDetails(
            WatchDetailCreateRequest common,
            WatchDetailUpdateRequest row
    ) {
        if (common == null && row == null) {
            return null;
        }

        WatchDetailCreateRequest merged = new WatchDetailCreateRequest();
        merged.setMechanismId(firstNonNull(row == null ? null : row.getMechanismId(), common == null ? null : common.getMechanismId()));
        merged.setGenderId(firstNonNull(row == null ? null : row.getGenderId(), common == null ? null : common.getGenderId()));
        merged.setCaseMaterialId(firstNonNull(row == null ? null : row.getCaseMaterialId(), common == null ? null : common.getCaseMaterialId()));
        merged.setStrapMaterialId(firstNonNull(row == null ? null : row.getStrapMaterialId(), common == null ? null : common.getStrapMaterialId()));
        merged.setGlassTypeId(firstNonNull(row == null ? null : row.getGlassTypeId(), common == null ? null : common.getGlassTypeId()));
        merged.setCaseSizeMm(firstNonNull(row == null ? null : row.getCaseSizeMm(), common == null ? null : common.getCaseSizeMm()));
        merged.setWaterResistance(firstNonBlank(row == null ? null : row.getWaterResistance(), common == null ? null : common.getWaterResistance()));
        merged.setStoneInlayId(firstNonNull(row == null ? null : row.getStoneInlayId(), common == null ? null : common.getStoneInlayId()));
        return merged;
    }

    private InteriorClockDetailCreateRequest mergeInteriorClockDetails(
            InteriorClockDetailCreateRequest common,
            InteriorClockDetailUpdateRequest row
    ) {
        if (common == null && row == null) {
            return null;
        }

        InteriorClockDetailCreateRequest merged = new InteriorClockDetailCreateRequest();
        merged.setProductionCountryId(firstNonNull(row == null ? null : row.getProductionCountryId(), common == null ? null : common.getProductionCountryId()));
        merged.setCaseMaterialId(firstNonNull(row == null ? null : row.getCaseMaterialId(), common == null ? null : common.getCaseMaterialId()));
        merged.setColorId(firstNonNull(row == null ? null : row.getColorId(), common == null ? null : common.getColorId()));
        merged.setStyleId(firstNonNull(row == null ? null : row.getStyleId(), common == null ? null : common.getStyleId()));
        merged.setMechanismTypeId(firstNonNull(row == null ? null : row.getMechanismTypeId(), common == null ? null : common.getMechanismTypeId()));
        merged.setPowerTypeId(firstNonNull(row == null ? null : row.getPowerTypeId(), common == null ? null : common.getPowerTypeId()));
        merged.setDimensions(firstNonBlank(row == null ? null : row.getDimensions(), common == null ? null : common.getDimensions()));
        merged.setWeightGrams(firstNonNull(row == null ? null : row.getWeightGrams(), common == null ? null : common.getWeightGrams()));
        merged.setWarrantyMonths(firstNonNull(row == null ? null : row.getWarrantyMonths(), common == null ? null : common.getWarrantyMonths()));
        return merged;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
