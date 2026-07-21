package com.shop.vympel.dtos.catalog;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class CatalogFilterResponse {
    private String key;
    private String label;
    private String type;
    private String source;
    private List<CatalogFilterOptionResponse> options;
    private BigDecimal min;
    private BigDecimal max;
}
