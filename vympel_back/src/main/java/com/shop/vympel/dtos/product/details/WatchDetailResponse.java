package com.shop.vympel.dtos.product.details;

import com.shop.vympel.dtos.product.features.*;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WatchDetailResponse {

    private Long productId;

    private FeatureDto mechanism;

    private FeatureDto gender;

    private FeatureDto caseMaterial;

    private FeatureDto strapMaterial;

    private FeatureDto glassType;

    private Integer caseSizeMm;
    private String waterResistance;

    private FeatureDto stoneInlay;
}
