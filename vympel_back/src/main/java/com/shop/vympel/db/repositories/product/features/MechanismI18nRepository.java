package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.i18n.WatchFeatureI18nId;
import com.shop.vympel.db.entity.i18n.WatchMechanismI18n;
import com.shop.vympel.db.entity.i18n.WatchMechanismI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MechanismI18nRepository extends JpaRepository<WatchMechanismI18n, WatchMechanismI18nId> {
    Optional<WatchMechanismI18n> findById(WatchMechanismI18nId id);
}
