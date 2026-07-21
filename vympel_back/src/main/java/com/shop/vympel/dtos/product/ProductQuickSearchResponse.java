package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.features.FeatureDto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductQuickSearchResponse {
    private Long id;
    private String name;
    private String model;
    private String sku;
    private FeatureDto brand;
    private CollectionResponse collection;
    private Integer price;
    private Integer stockQuantity;
    private String status;
    private String imageUrl;
}
