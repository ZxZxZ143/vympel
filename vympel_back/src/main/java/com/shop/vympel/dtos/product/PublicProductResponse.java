package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.product.description.DescriptionResponse;
import com.shop.vympel.dtos.product.details.AccessoryDetailResponse;
import com.shop.vympel.dtos.product.details.InteriorClockDetailResponse;
import com.shop.vympel.dtos.product.details.WatchDetailResponse;
import com.shop.vympel.dtos.product.features.BrandResponse;
import com.shop.vympel.dtos.product.features.CollectionResponse;
import com.shop.vympel.dtos.product.image.ProductImageResponse;

import java.util.List;

public record PublicProductResponse(
        Long id,
        String sku,
        String name,
        String model,
        Integer price,
        Integer stockQuantity,
        String status,
        String productType,
        CategoryResponse category,
        BrandResponse brand,
        CollectionResponse collection,
        List<ProductImageResponse> images,
        DescriptionResponse description,
        WatchDetailResponse watchDetails,
        InteriorClockDetailResponse interiorClockDetails,
        AccessoryDetailResponse accessoryDetails,
        String kaspiUrl,
        String wildberriesUrl,
        Double ratingAverage,
        Long ratingCount
) {
    public static PublicProductResponse from(ProductResponse response) {
        return new PublicProductResponse(
                response.getId(),
                response.getSku(),
                response.getName(),
                response.getModel(),
                response.getPrice(),
                response.getStockQuantity(),
                response.getStatus(),
                response.getProductType(),
                response.getCategory(),
                response.getBrand(),
                response.getCollection(),
                response.getImages(),
                response.getDescription(),
                response.getWatchDetails(),
                response.getInteriorClockDetails(),
                response.getAccessoryDetails(),
                response.getKaspiUrl(),
                response.getWildberriesUrl(),
                response.getRatingAverage(),
                response.getRatingCount()
        );
    }
}
