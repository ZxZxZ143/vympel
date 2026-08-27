package com.shop.vympel.dtos.product.details;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccessoryDetailUpdateRequest {
    @Size(max = 100)
    private String claspType;

    private Long caseMaterialId;
    private Long insertMaterialId;
    private Boolean hasInsert;
    private Long colorId;

    @Size(max = 100)
    private String length;
}
