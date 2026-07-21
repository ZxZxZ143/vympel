package com.shop.vympel.services.categoryProduct;

import com.shop.vympel.db.entity.product.Category;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.ProductCategory;
import com.shop.vympel.db.entity.product.ProductCategoryId;
import com.shop.vympel.db.repositories.category.CategoryRepository;
import com.shop.vympel.db.repositories.product.ProductCategoryRepository;
import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.mappers.category.CategoryMapper;
import com.shop.vympel.mappers.product.ProductMapper;
import com.shop.vympel.services.category.CategoryService;
import com.shop.vympel.services.catalog.PublicProductQueryService;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CategoryProductServiceImpl implements CategoryProductService {
    private final ProductMapper productMapper;
    private final ProductCategoryRepository productCategoryRepository;
    private final PublicProductQueryService publicProductQueryService;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final CategoryMapper categoryMapper;


    @Override
    @Transactional
    public void linkWithProduct(Long categoryId, Product product) throws IllegalArgumentException {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        ProductCategory productCategory = new ProductCategory();

        ProductCategoryId productCategoryId = new ProductCategoryId();
        productCategoryId.setProductId(product.getId());
        productCategoryId.setCategoryId(categoryId);

        productCategory.setProduct(product);
        productCategory.setCategory(category);
        productCategory.setId(productCategoryId);

        productCategoryRepository.save(productCategory);
    }

    @Override
    @Transactional
    public void relinkWithProduct(Long categoryId, Product product) throws IllegalArgumentException {
        ProductCategory existing = productCategoryRepository
                .getByProductId(product.getId())
                .orElse(null);

        if (existing != null) {
            if (existing.getCategory().getId().equals(categoryId)) {
                return;
            }

            productCategoryRepository.delete(existing);
        }

        linkWithProduct(categoryId, product);
    }

    @Override
    @Transactional
    public CategoryResponse getByProductId(Long productId, Language language) throws IllegalArgumentException {
        ProductCategory productCategory = productCategoryRepository
                .getByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product category not found"));

        return categoryService.getById(productCategory.getCategory().getId(), language);
    }

    @Override
    @Transactional
    public Page<ProductShortResponse> getAllByCategoryId(Long categoryId, Pageable pageable) {
        return publicProductQueryService
                .findAll(activeProductsInCategories(Set.of(categoryId)), pageable)
                .map(productMapper::toShortResponse);
    }

    @Override
    @Transactional()
    public Page<ProductShortResponse> getAllByCategoryCode(String categoryCode, Pageable pageable) {
        String normalizedCategoryCode = normalizeCategoryCode(categoryCode);

        Category rootCategory = categoryRepository.findByCode(normalizedCategoryCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Category not found by code: " + normalizedCategoryCode
                ));
        Set<Long> categoryIds = collectCategoryIds(rootCategory);

        return publicProductQueryService
                .findAll(activeProductsInCategories(categoryIds), pageable)
                .map(productMapper::toShortResponse);
    }

    private Specification<Product> activeProductsInCategories(Collection<Long> categoryIds) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(cb.equal(root.get("status"), "ACTIVE"));

            Subquery<Long> subquery = criteriaQuery.subquery(Long.class);
            Root<ProductCategory> productCategory = subquery.from(ProductCategory.class);
            subquery.select(productCategory.get("product").get("id"));
            subquery.where(
                    cb.equal(productCategory.get("product").get("id"), root.get("id")),
                    productCategory.get("category").get("id").in(categoryIds)
            );
            predicates.add(cb.exists(subquery));

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private String normalizeCategoryCode(String categoryCode) {
        return categoryCode
                .replace("-", "_")
                .toUpperCase(Locale.ROOT);
    }

    private Set<Long> collectCategoryIds(Category rootCategory) {
        Set<Long> ids = new HashSet<>();
        collectCategoryIdsRecursive(rootCategory, ids);
        return ids;
    }

    private void collectCategoryIdsRecursive(Category category, Set<Long> ids) {
        if (category == null || category.getId() == null) {
            return;
        }

        if (!ids.add(category.getId())) {
            return;
        }

        List<Category> children = categoryRepository.findByParentId(category.getId());

        for (Category child : children) {
            collectCategoryIdsRecursive(child, ids);
        }
    }
}
