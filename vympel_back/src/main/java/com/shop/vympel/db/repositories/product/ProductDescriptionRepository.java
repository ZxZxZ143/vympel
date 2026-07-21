package com.shop.vympel.db.repositories.product;

import com.shop.vympel.db.entity.features.ProductDescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductDescriptionRepository extends JpaRepository<ProductDescription, Long> {
    Optional<ProductDescription> findByProductId(Long productId);
}
