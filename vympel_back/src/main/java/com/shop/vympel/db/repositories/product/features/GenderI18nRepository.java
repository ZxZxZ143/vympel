package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.i18n.GenderI18n;
import com.shop.vympel.db.entity.i18n.GenderI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenderI18nRepository extends JpaRepository<GenderI18n, GenderI18nId> {
}
