package com.shop.vympel.db.repositories.product;

import com.shop.vympel.db.entity.features.ProductDescriptionI18n;
import com.shop.vympel.db.entity.features.ProductDescriptionI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductDescriptionI18Repository extends JpaRepository<ProductDescriptionI18n, ProductDescriptionI18nId> {
    Optional<ProductDescriptionI18n> findProductDescriptionI18nById(ProductDescriptionI18nId productDescriptionI18nId);
}
