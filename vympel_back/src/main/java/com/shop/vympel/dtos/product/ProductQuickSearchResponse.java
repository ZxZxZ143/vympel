package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.features.FeatureDto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@lombok.NoArgsConstructor
public class ProductQuickSearchResponse {
    private Long id;
    private String name;
    private String model;
    private String sku;
    private FeatureDto brand;
    private CollectionResponse collection;
    private Integer price;
    private Integer discountPercent;
    private Integer stockQuantity;
    private String status;
    private String imageUrl;

    public ProductQuickSearchResponse(Long id, String name, String model, String sku, FeatureDto brand, CollectionResponse collection, Integer price, Integer stockQuantity, String status, String imageUrl) {
        this(id, name, model, sku, brand, collection, price, null, stockQuantity, status, imageUrl);
    }

    public Integer getFinalPrice() {
        return com.shop.vympel.services.product.ProductPricing.finalPrice(price, discountPercent);
    }
}
