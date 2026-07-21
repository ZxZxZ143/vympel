package com.shop.vympel.db.repositories.product;

import com.shop.vympel.db.entity.i18n.ProductI18n;
import com.shop.vympel.db.entity.i18n.ProductI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface Producti18nRepository extends JpaRepository<ProductI18n, ProductI18nId> {
    Optional<ProductI18n> findProductI18nById(ProductI18nId productI18nId);
}
