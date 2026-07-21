package com.shop.vympel.dtos.product.details;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WatchDetailCreateRequest {

    private Long mechanismId;
    private Long genderId;

    private Long caseMaterialId;
    private Long strapMaterialId;
    private Long glassTypeId;

    @PositiveOrZero
    private Integer caseSizeMm;

    @Size(max = 50)
    private String waterResistance;

    private Long stoneInlayId;
}
