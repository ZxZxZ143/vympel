package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.i18n.CollectionI18n;
import com.shop.vympel.db.entity.i18n.CollectionI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionI18nRepository extends JpaRepository<CollectionI18n, CollectionI18nId> {
}
