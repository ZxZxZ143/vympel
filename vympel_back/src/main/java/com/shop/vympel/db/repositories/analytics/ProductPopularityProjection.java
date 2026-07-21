package com.shop.vympel.db.repositories.analytics;

import java.math.BigDecimal;
import java.time.Instant;

public interface ProductPopularityProjection {
    Long getProductId();

    String getSku();

    String getName();

    String getModel();

    Integer getStockQuantity();

    String getStatus();

    String getPromotionMode();

    BigDecimal getPromotionScore();

    Instant getPromotedUntil();

    Long getViews();

    Long getFavorites();

    Long getCartAdditions();
}
