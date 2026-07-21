package com.shop.vympel.dtos.catalog;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CatalogCategoryContextResponse {
    private Long id;
    private String slug;
    private String label;
    private String parentSlug;
    private String inheritsFiltersFrom;
}
