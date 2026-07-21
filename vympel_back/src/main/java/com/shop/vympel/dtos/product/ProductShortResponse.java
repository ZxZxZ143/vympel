package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.features.CollectionResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductShortResponse {
    private Long id;
    private String name;
    private String model;
    private Integer price;
    private Integer stockQuantity;
    private String status;
    private String imageUrl;
    private String kaspiUrl;
    private String wildberriesUrl;
    private CollectionResponse collection;
    private Double ratingAverage;
    private Long ratingCount;
}
