package com.shop.vympel.services.category;

import com.shop.vympel.db.entity.product.Category;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.ProductCategory;
import com.shop.vympel.db.entity.product.ProductCategoryId;
import com.shop.vympel.db.repositories.category.CategoryRepository;
import com.shop.vympel.db.repositories.category.CategoryI18Repository;
import com.shop.vympel.db.entity.i18n.CategoryI18n;
import com.shop.vympel.db.entity.i18n.CategoryI18nId;
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
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final CategoryI18Repository categoryI18Repository;

    @Override
    public List<CategoryResponse> getAll(Language lang) {
        List<Category> categories = categoryRepository.findAllPubliclyVisible();
        Map<Long, String> names = loadNames(categories, lang);
        return categories.stream().map(category -> toResponse(category, names)).toList();
    }

    @Override
    @Transactional
    public CategoryResponse getById(Long id, Language lang) throws IllegalArgumentException {
        Category category = categoryRepository.findPubliclyVisibleById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        return categoryMapper.toResponse(category, lang);
    }

    @Override
    @Transactional
    public CategoryWithParentResponse getByCategoryCodeWithParents(String categoryCode, Language language) throws IllegalArgumentException {
        Category category = categoryRepository.findPubliclyVisibleByCode(categoryCode.toUpperCase().replaceAll("-", "_"))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        List<Category> lineage = new java.util.ArrayList<>();
        for (Category current = category; current != null; current = current.getParent()) {
            lineage.add(current);
        }
        return toResponseWithParent(category, loadNames(lineage, language));
    }

    private Map<Long, String> loadNames(List<Category> categories, Language language) {
        if (categories.isEmpty()) {
            return Map.of();
        }
        List<CategoryI18nId> ids = categories.stream()
                .map(category -> new CategoryI18nId(category.getId(), language.getValue()))
                .toList();
        Map<Long, String> names = new LinkedHashMap<>();
        categoryI18Repository.findAllById(ids)
                .forEach(value -> names.put(value.getId().getCategoryId(), value.getName()));
        return names;
    }

    private CategoryResponse toResponse(Category category, Map<Long, String> names) {
        CategoryResponse response = new CategoryResponse();
        response.setId(Math.toIntExact(category.getId()));
        response.setName(requiredName(category, names));
        response.setCode(category.getCode());
        response.setParentId(category.getParent() == null ? null : Math.toIntExact(category.getParent().getId()));
        return response;
    }

    private CategoryWithParentResponse toResponseWithParent(Category category, Map<Long, String> names) {
        CategoryWithParentResponse response = new CategoryWithParentResponse();
        response.setId(Math.toIntExact(category.getId()));
        response.setName(requiredName(category, names));
        response.setCode(category.getCode());
        response.setParent(category.getParent() == null ? null : toResponseWithParent(category.getParent(), names));
        return response;
    }

    private String requiredName(Category category, Map<Long, String> names) {
        String name = names.get(category.getId());
        if (name == null) {
            throw new ResourceNotFoundException("Category translation not found");
        }
        return name;
    }
}
