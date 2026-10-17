package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@lombok.NoArgsConstructor
public class ProductShortResponse {
    private Long id;
    private String name;
    private String model;
    private Integer price;
    private Integer discountPercent;
    private Integer stockQuantity;
    private String status;
    private String imageUrl;
    private String kaspiUrl;
    private String wildberriesUrl;
    private CollectionResponse collection;
    private Double ratingAverage;
    private Long ratingCount;

    public ProductShortResponse(Long id, String name, String model, Integer price, Integer stockQuantity, String status, String imageUrl, String kaspiUrl, String wildberriesUrl, CollectionResponse collection, Double ratingAverage, Long ratingCount) {
        this(id, name, model, price, null, stockQuantity, status, imageUrl, kaspiUrl, wildberriesUrl, collection, ratingAverage, ratingCount);
    }

    public Integer getFinalPrice() {
        return com.shop.vympel.services.product.ProductPricing.finalPrice(price, discountPercent);
    }
}
