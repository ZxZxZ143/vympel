package com.shop.vympel.dtos.catalog;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CatalogFilterOptionResponse {
    private String value;
    private String label;
    private long count;
    private boolean disabled;
}
