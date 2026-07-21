package com.shop.vympel.services.categoryProduct;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.enums.Language;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoryProductService {
    void linkWithProduct(Long categoryId, Product product);

    void relinkWithProduct(Long categoryId, Product product);

    CategoryResponse getByProductId(Long productId, Language language) throws IllegalArgumentException;

    Page<ProductShortResponse> getAllByCategoryId(Long categoryId, Pageable pageable);

    Page<ProductShortResponse> getAllByCategoryCode(String categoryCode, Pageable pageable);
}
