package com.shop.vympel.dtos.catalog;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class CatalogProductQuery {
    private String categoryCode;
    private String search;
    private BigDecimal priceMin;
    private BigDecimal priceMax;
    private Map<String, List<String>> filters;
}
