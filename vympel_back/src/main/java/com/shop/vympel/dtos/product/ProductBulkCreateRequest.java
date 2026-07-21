package com.shop.vympel.dtos.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductBulkCreateRequest {
    @NotNull
    private Long categoryId;

    @Valid
    @NotNull
    private ProductBulkCommonRequest common;

    @Valid
    @NotEmpty
    @Size(max = 100)
    private List<ProductBulkRowRequest> rows;
}
