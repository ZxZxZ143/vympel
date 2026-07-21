package com.shop.vympel.dtos.category;

import lombok.Data;

@Data
public class CategoryWithParentResponse {
    private Integer id;
    private String name;
    private String code;
    private CategoryWithParentResponse parent;
}
