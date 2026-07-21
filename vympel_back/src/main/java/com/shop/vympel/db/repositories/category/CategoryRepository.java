package com.shop.vympel.db.repositories.category;

import com.shop.vympel.db.entity.product.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> getByCode(String categoryCode);

    Optional<Category> findByCode(String code);

    List<Category> findByParentId(Long parentId);

}
