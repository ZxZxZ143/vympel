package com.shop.vympel.dtos.collection;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CollectionCreateRequest {
    @NotNull
    private Integer brandId;

    @NotNull
    @Size(max = 100)
    private String name;
}
