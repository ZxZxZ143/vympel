package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.dtos.product.details.InteriorClockDetailCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductCreateRequest {

    @Valid
    @NotNull
    private ProductNameCreateRequest productName;

    @NotBlank
    @Size(max = 255)
    private String model;

    @NotNull
    @PositiveOrZero
    private Integer price;

    @PositiveOrZero
    private Integer stockQuantity;

    @Size(max = 20)
    @NotBlank
    private String status;

    @Size(max = 30)
    @NotBlank
    private String productType;

    @NotNull
    private Long brandId;

    private Long collectionId;

    @NotNull
    private Long categoryId;

    @Valid
    private DescriptionCreateRequest description;

    @Valid
    private WatchDetailCreateRequest watchDetails;

    @Valid
    private InteriorClockDetailCreateRequest interiorClockDetails;

    @Size(max = 2048)
    private String kaspiUrl;

    @Size(max = 2048)
    private String wildberriesUrl;
}
