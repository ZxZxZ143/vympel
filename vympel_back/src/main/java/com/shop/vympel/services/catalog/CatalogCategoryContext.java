package com.shop.vympel.services.catalog;

import com.shop.vympel.db.entity.product.Category;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CatalogCategoryContext {
    private Category category;
    private CatalogCategoryProfile profile;
    private String inheritsFiltersFrom;
    private List<Long> scopeCategoryIds;
}
