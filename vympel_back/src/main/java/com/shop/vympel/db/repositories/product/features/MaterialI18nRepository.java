package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.i18n.MaterialI18n;
import com.shop.vympel.db.entity.i18n.MaterialI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MaterialI18nRepository extends JpaRepository<MaterialI18n, MaterialI18nId> {
    Optional<MaterialI18n> findById(MaterialI18nId id);
}
