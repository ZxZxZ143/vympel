package com.shop.vympel.db.repositories.product;

import com.shop.vympel.db.entity.product.ProductCategory;
import com.shop.vympel.db.entity.product.ProductCategoryId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, ProductCategoryId> {
    Optional<ProductCategory> getByProductId(Long productId);

    Page<ProductCategory> getAllByCategoryId(Long categoryId,
                                             Pageable pageable);

    @Query("""
            SELECT pc
            FROM ProductCategory pc
            JOIN pc.product p
            JOIN pc.category c
            WHERE c.id IN :categoryIds
            """)
    Page<ProductCategory> findAllByCategoryIds(
            @Param("categoryIds") Collection<Long> categoryIds,
            Pageable pageable
    );
}
