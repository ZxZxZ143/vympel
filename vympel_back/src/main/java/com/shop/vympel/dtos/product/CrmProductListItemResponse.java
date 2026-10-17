package com.shop.vympel.dtos.product;

import com.shop.vympel.db.entity.product.Product;

public record CrmProductListItemResponse(
        Long id,
        String sku,
        String name,
        String model,
        Integer price,
        Integer discountPercent,
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
                product.getDiscountPercent(),
                product.getStockQuantity(),
                product.getStatus(),
                product.getKaspiUrl(),
                product.getWildberriesUrl(),
                modelVariantGroup
        );
    }

    public CrmProductListItemResponse(Long id, String sku, String name, String model, Integer price, Integer stockQuantity, String status, String kaspiUrl, String wildberriesUrl, ProductModelVariantGroupResponse modelVariantGroup) {
        this(id, sku, name, model, price, null, stockQuantity, status, kaspiUrl, wildberriesUrl, modelVariantGroup);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("finalPrice")
    public Integer finalPrice() {
        return com.shop.vympel.services.product.ProductPricing.finalPrice(price, discountPercent);
    }
}
