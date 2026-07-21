package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.dtos.product.details.InteriorClockDetailUpdateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailUpdateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductUpdateRequest {

    @Valid
    private ProductNameCreateRequest productName;

    @Size(max = 255)
    private String model;

    @PositiveOrZero
    private Integer price;

    @PositiveOrZero
    private Integer stockQuantity;

    @Size(max = 20)
    private String status;

    @Size(max = 30)
    private String productType;

    private Long brandId;

    private Long collectionId;

    private Long categoryId;

    @Valid
    private DescriptionCreateRequest description;

    @Valid
    private WatchDetailUpdateRequest watchDetails;

    @Valid
    private InteriorClockDetailUpdateRequest interiorClockDetails;

    @Size(max = 2048)
    private String kaspiUrl;

    @Size(max = 2048)
    private String wildberriesUrl;
}
