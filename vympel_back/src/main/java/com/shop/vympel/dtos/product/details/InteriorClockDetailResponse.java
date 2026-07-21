package com.shop.vympel.dtos.product.details;

import com.shop.vympel.dtos.product.features.FeatureDto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InteriorClockDetailResponse {
    private Long productId;
    private FeatureDto productionCountry;
    private FeatureDto caseMaterial;
    private FeatureDto color;
    private FeatureDto style;
    private FeatureDto mechanismType;
    private FeatureDto powerType;
    private String dimensions;
    private Integer weightGrams;
    private Integer warrantyMonths;
}
