package com.shop.vympel.dtos.category;

import lombok.Data;

@Data
public class CategoryResponse {
    private Integer id;
    private String name;
    private String code;
    private Integer parentId;
}
