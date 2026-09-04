package com.shop.vympel.db.repositories.product;

public interface ProductModelVariantRow {
    Long getAnchorId();

    Long getId();

    String getName();

    String getModel();

    String getStatus();

    Long getImageId();

    String getImageKey();

    Integer getImageSortOrder();

    Boolean getImageMain();

    Long getVariantCount();

    Long getVariantOrder();
}
