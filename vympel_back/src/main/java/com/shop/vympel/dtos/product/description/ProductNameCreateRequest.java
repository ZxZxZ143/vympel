package com.shop.vympel.dtos.product.description;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductNameCreateRequest {
    @Size(max = 255)
    private String name_kz;

    @NotBlank
    @Size(max = 255)
    private String name_ru;

    @Size(max = 255)
    private String name_en;
}
