package com.shop.vympel.dtos.product;

import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.details.InteriorClockDetailCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductBulkCommonRequest {
    @NotNull
    private Long brandId;

    private Long collectionId;

    @Size(max = 20)
    @NotNull
    private String status;

    @Size(max = 30)
    @NotNull
    private String productType;

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
