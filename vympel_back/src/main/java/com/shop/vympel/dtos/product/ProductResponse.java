package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.DescriptionResponse;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.dtos.product.details.AccessoryDetailResponse;
import com.shop.vympel.dtos.product.details.InteriorClockDetailResponse;
import com.shop.vympel.dtos.product.details.WatchDetailResponse;
import com.shop.vympel.dtos.product.features.BrandResponse;
import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.image.ProductImageResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@lombok.NoArgsConstructor
public class ProductResponse {

    private Long id;
    private String sku;
    private String name;
    private ProductNameCreateRequest productName;
    private String model;

    private Integer price;
    private Integer discountPercent;
    private Integer stockQuantity;
    private String status;
    private String productType;

    private CategoryResponse category;

    private BrandResponse brand;

    private CollectionResponse collection;

    private List<ProductImageResponse> images;

    private DescriptionResponse description;
    private DescriptionCreateRequest descriptionTranslations;

    private WatchDetailResponse watchDetails;

    private InteriorClockDetailResponse interiorClockDetails;

    private AccessoryDetailResponse accessoryDetails;

    private String kaspiUrl;

    private String wildberriesUrl;

    private String promotionMode;

    private BigDecimal promotionScore;

    private Instant promotedUntil;

    private Instant promotionUpdatedAt;

    private ProductModelVariantGroupResponse modelVariantGroup;

    private Double ratingAverage;

    private Long ratingCount;

    public ProductResponse(Long id, String sku, String name, ProductNameCreateRequest productName, String model, Integer price, Integer stockQuantity, String status, String productType, CategoryResponse category, BrandResponse brand, CollectionResponse collection, List<ProductImageResponse> images, DescriptionResponse description, DescriptionCreateRequest descriptionTranslations, WatchDetailResponse watchDetails, InteriorClockDetailResponse interiorClockDetails, AccessoryDetailResponse accessoryDetails, String kaspiUrl, String wildberriesUrl, String promotionMode, BigDecimal promotionScore, Instant promotedUntil, Instant promotionUpdatedAt, ProductModelVariantGroupResponse modelVariantGroup, Double ratingAverage, Long ratingCount) {
        this(id, sku, name, productName, model, price, null, stockQuantity, status, productType, category, brand, collection, images, description, descriptionTranslations, watchDetails, interiorClockDetails, accessoryDetails, kaspiUrl, wildberriesUrl, promotionMode, promotionScore, promotedUntil, promotionUpdatedAt, modelVariantGroup, ratingAverage, ratingCount);
    }

    public Integer getFinalPrice() {
        return com.shop.vympel.services.product.ProductPricing.finalPrice(price, discountPercent);
    }
}
