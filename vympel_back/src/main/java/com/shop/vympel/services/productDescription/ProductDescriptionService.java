package com.shop.vympel.services.productDescription;

import com.shop.vympel.db.entity.features.ProductDescription;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.DescriptionResponse;
import com.shop.vympel.enums.Language;

public interface ProductDescriptionService {
    void addProductDescription(Product product, Language language, DescriptionCreateRequest descriptionCreateRequest);
    DescriptionResponse getDescriptionContentById(Long id, Language language);
    DescriptionCreateRequest getDescriptionTranslationsByProductId(Long productId);

    ProductDescription getDescriptionById(Long productId);
}
