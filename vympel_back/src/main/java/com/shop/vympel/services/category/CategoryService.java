package com.shop.vympel.services.category;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.category.CategoryWithParentResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.enums.Language;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAll(Language lang);

    CategoryResponse getById(Long id, Language lang) throws IllegalArgumentException;

    CategoryWithParentResponse getByCategoryCodeWithParents(String categoryCode, Language language) throws IllegalArgumentException;

}
