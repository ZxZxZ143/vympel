package com.shop.vympel.services.productName;

import com.shop.vympel.db.entity.i18n.ProductI18n;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.enums.Language;

import java.util.Collection;
import java.util.Map;

public interface ProductNameService {
    void createProductName(Product product, Language language, String name);

    ProductI18n getById(Long productId, Language language);

    ProductNameCreateRequest getTranslationsByProductId(Long productId);

    Map<Long, String> getNamesByProductIds(Collection<Long> productIds, Language language);
}
