package com.shop.vympel.db.repositories.review;

public interface ProductRatingProjection {
    Long getProductId();

    Double getRatingAverage();

    Long getRatingCount();
}
