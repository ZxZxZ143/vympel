package com.shop.vympel.dtos.catalog;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CatalogFiltersResponse {
    private CatalogCategoryContextResponse category;
    private List<CatalogFilterResponse> filters;
}
