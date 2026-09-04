package com.shop.vympel.dtos.product.details;

import com.shop.vympel.dtos.product.features.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

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

    private FeatureDto dialType;
    private FeatureDto dialMarking;
    private FeatureDto powerSource;
    private FeatureDto waterResistanceOption;
    private FeatureDto strapColor;
    private FeatureDto dialColor;
    private String packageContents;
    private List<FeatureDto> features;
}
