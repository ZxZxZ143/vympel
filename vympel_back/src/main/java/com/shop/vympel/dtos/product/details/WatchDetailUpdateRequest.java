package com.shop.vympel.dtos.product.details;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WatchDetailUpdateRequest {

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

    private Long dialTypeId;
    private Long dialMarkingId;
    private Long powerSourceId;
    private Long waterResistanceId;
    private Long strapColorId;
    private Long dialColorId;

    @Size(max = 500)
    private String packageContents;

    @Size(max = 50)
    private List<@Positive Long> featureIds;
}
