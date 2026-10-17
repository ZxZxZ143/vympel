package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;

public record ProductRecommendationResponse(
        Long id,
        String name,
        String model,
        Integer price,
        Integer discountPercent,
        Integer stockQuantity,
        String status,
        String imageUrl,
        String kaspiUrl,
        String wildberriesUrl,
        CollectionResponse collection,
        Double ratingAverage,
        Long ratingCount
) {

    public ProductRecommendationResponse(Long id, String name, String model, Integer price, Integer stockQuantity, String status, String imageUrl, String kaspiUrl, String wildberriesUrl, CollectionResponse collection, Double ratingAverage, Long ratingCount) {
        this(id, name, model, price, null, stockQuantity, status, imageUrl, kaspiUrl, wildberriesUrl, collection, ratingAverage, ratingCount);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("finalPrice")
    public Integer finalPrice() {
        return com.shop.vympel.services.product.ProductPricing.finalPrice(price, discountPercent);
    }
}
