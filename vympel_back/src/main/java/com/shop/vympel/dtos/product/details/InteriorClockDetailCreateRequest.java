package com.shop.vympel.dtos.product.details;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InteriorClockDetailCreateRequest {
    private Long productionCountryId;

    private Long caseMaterialId;

    private Long colorId;

    private Long styleId;

    private Long mechanismTypeId;

    private Long powerTypeId;

    @Size(max = 100)
    private String dimensions;

    @PositiveOrZero
    private Integer weightGrams;

    @PositiveOrZero
    private Integer warrantyMonths;
}
