package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.features.FeatureDto;

public record ProductBatchSummaryItemResponse(
        Long id,
        String name,
        String model,
        String sku,
        Integer price,
        Integer discountPercent,
        Integer stockQuantity,
        String status,
        String imageUrl,
        String kaspiUrl,
        String wildberriesUrl,
        CollectionResponse collection,
        FeatureDto brand,
        String categoryCode,
        String categoryName,
        Double ratingAverage,
        Long ratingCount
) {

    public ProductBatchSummaryItemResponse(Long id, String name, String model, String sku, Integer price, Integer stockQuantity, String status, String imageUrl, String kaspiUrl, String wildberriesUrl, CollectionResponse collection, FeatureDto brand, String categoryCode, String categoryName, Double ratingAverage, Long ratingCount) {
        this(id, name, model, sku, price, null, stockQuantity, status, imageUrl, kaspiUrl, wildberriesUrl, collection, brand, categoryCode, categoryName, ratingAverage, ratingCount);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("finalPrice")
    public Integer finalPrice() {
        return com.shop.vympel.services.product.ProductPricing.finalPrice(price, discountPercent);
    }
}
