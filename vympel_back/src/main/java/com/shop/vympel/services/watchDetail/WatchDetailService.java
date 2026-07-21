package com.shop.vympel.services.watchDetail;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.WatchDetail;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailResponse;
import com.shop.vympel.dtos.product.details.WatchDetailUpdateRequest;
import com.shop.vympel.enums.Language;

public interface WatchDetailService {
    WatchDetailResponse getWatchDetailById(Long id, Language lang);
    WatchDetailResponse getWatchDetailByIdOrNull(Long id, Language lang);
    WatchDetail create(WatchDetailCreateRequest watchDetailCreateRequest, Product product);
    WatchDetail update(WatchDetailUpdateRequest watchDetailUpdateRequest, Product product);
}
