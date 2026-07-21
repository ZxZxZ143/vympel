package com.shop.vympel.services.catalog;

import com.shop.vympel.db.entity.product.Category;
import com.shop.vympel.db.repositories.category.CategoryRepository;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CatalogCategoryProfileService {
    private static final Set<String> WRISTWATCH_CODES = Set.of(
            "WATCH_WRIST",
            "WATCH_MEN",
            "WATCH_WOMEN",
            "WATCH_UNISEX",
            "SMARTWATCH",
            "WATCH_KIDS",
            "WATCH_CLASSIC",
            "WATCH_SPORT",
            "WATCH_DIVER",
            "WATCH_CHRONOGRAPH"
    );

    private static final Set<String> INTERIOR_CODES = Set.of(
            "WATCH_INTERIOR",
            "WATCH_WALL",
            "WATCH_FLOOR"
    );

    private static final Set<String> ACCESSORY_CODES = Set.of(
            "ACCESSORIES",
            "ACCESSORY",
            "APPLE_CASE"
    );

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public CatalogCategoryContext resolveContext(String categoryCode) {
        if (categoryCode == null || categoryCode.isBlank()) {
            return new CatalogCategoryContext(null, CatalogCategoryProfile.GENERIC, null, List.of());
        }

        Category category = categoryRepository.getByCode(normalizeCode(categoryCode))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryCode));

        CatalogCategoryProfile profile = profileFor(category);
        return new CatalogCategoryContext(
                category,
                profile,
                inheritsFiltersFrom(category, profile),
                descendantIds(category)
        );
    }

    @Transactional(readOnly = true)
    public CatalogCategoryProfile profileForCategoryId(Long categoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("Category id is required");
        }
        return categoryRepository.findById(categoryId)
                .map(this::profileFor)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    public CatalogCategoryProfile profileFor(Category category) {
        return profileForCodeChain(codeChain(category));
    }

    public String normalizeCode(String value) {
        return value.trim().replace('-', '_').toUpperCase(Locale.ROOT);
    }

    private CatalogCategoryProfile profileForCodeChain(List<String> codes) {
        if (codes.stream().anyMatch(WRISTWATCH_CODES::contains)) return CatalogCategoryProfile.WRISTWATCH;
        if (codes.stream().anyMatch(INTERIOR_CODES::contains)) return CatalogCategoryProfile.INTERIOR_CLOCK;
        if (codes.stream().anyMatch(ACCESSORY_CODES::contains)) return CatalogCategoryProfile.ACCESSORY;
        return CatalogCategoryProfile.GENERIC;
    }

    private String inheritsFiltersFrom(Category category, CatalogCategoryProfile profile) {
        if (profile != CatalogCategoryProfile.WRISTWATCH || category == null) {
            return null;
        }

        String code = normalizeCode(category.getCode());
        return "WATCH_WRIST".equals(code) ? null : "watch-wrist";
    }

    private List<String> codeChain(Category category) {
        ArrayDeque<String> codes = new ArrayDeque<>();
        Category current = category;
        while (current != null) {
            codes.add(current.getCode());
            current = current.getParent();
        }
        return codes.stream()
                .map(this::normalizeCode)
                .toList();
    }

    private List<Long> descendantIds(Category root) {
        List<Category> categories = categoryRepository.findAll();
        Set<Long> ids = new HashSet<>();
        collectDescendants(root, categories, ids);
        return ids.stream().toList();
    }

    private void collectDescendants(Category category, List<Category> categories, Set<Long> ids) {
        if (category == null || category.getId() == null || !ids.add(category.getId())) {
            return;
        }

        categories.stream()
                .filter(candidate -> Optional.ofNullable(candidate.getParent())
                        .map(Category::getId)
                        .filter(category.getId()::equals)
                        .isPresent())
                .forEach(child -> collectDescendants(child, categories, ids));
    }
}
