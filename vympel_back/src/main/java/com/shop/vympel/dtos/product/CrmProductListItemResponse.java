package com.shop.vympel.dtos.product;

import com.shop.vympel.db.entity.product.Product;

public record CrmProductListItemResponse(
        Long id,
        String sku,
        String name,
        String model,
        Integer price,
        Integer stockQuantity,
        String status,
        String kaspiUrl,
        String wildberriesUrl,
        ProductModelVariantGroupResponse modelVariantGroup
) {
    public static CrmProductListItemResponse from(
            Product product,
            String localizedName,
            ProductModelVariantGroupResponse modelVariantGroup
    ) {
        return new CrmProductListItemResponse(
                product.getId(),
                product.getSku(),
                localizedName,
                product.getModel(),
                product.getPrice() == null ? null : product.getPrice().intValue(),
                product.getStockQuantity(),
                product.getStatus(),
                product.getKaspiUrl(),
                product.getWildberriesUrl(),
                modelVariantGroup
        );
    }
}
