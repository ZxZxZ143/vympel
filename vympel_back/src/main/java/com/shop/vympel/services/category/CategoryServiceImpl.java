package com.shop.vympel.services.category;

import com.shop.vympel.db.entity.product.Category;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.ProductCategory;
import com.shop.vympel.db.entity.product.ProductCategoryId;
import com.shop.vympel.db.repositories.category.CategoryRepository;
import com.shop.vympel.db.repositories.product.ProductCategoryRepository;
import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.category.CategoryWithParentResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.mappers.category.CategoryMapper;
import com.shop.vympel.mappers.product.ProductMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public List<CategoryResponse> getAll(Language lang) {
        return categoryMapper.toResponse(
                categoryRepository.findAll(),
                lang
        );
    }

    @Override
    @Transactional
    public CategoryResponse getById(Long id, Language lang) throws IllegalArgumentException {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        return categoryMapper.toResponse(category, lang);
    }

    @Override
    @Transactional
    public CategoryWithParentResponse getByCategoryCodeWithParents(String categoryCode, Language language) throws IllegalArgumentException {
        Category category = categoryRepository.getByCode(categoryCode.toUpperCase().replaceAll("-", "_"))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        return categoryMapper.toResponseWithParent(category, language);
    }
}
