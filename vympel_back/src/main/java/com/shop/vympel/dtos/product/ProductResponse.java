package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.DescriptionResponse;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
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
public class ProductResponse {

    private Long id;
    private String sku;
    private String name;
    private ProductNameCreateRequest productName;
    private String model;

    private Integer price;
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

    private String kaspiUrl;

    private String wildberriesUrl;

    private String promotionMode;

    private BigDecimal promotionScore;

    private Instant promotedUntil;

    private Instant promotionUpdatedAt;

    private Double ratingAverage;

    private Long ratingCount;
}
