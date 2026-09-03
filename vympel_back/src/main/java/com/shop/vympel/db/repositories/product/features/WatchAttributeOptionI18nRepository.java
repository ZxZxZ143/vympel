package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.i18n.WatchAttributeOptionI18n;
import com.shop.vympel.db.entity.i18n.WatchAttributeOptionI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchAttributeOptionI18nRepository
        extends JpaRepository<WatchAttributeOptionI18n, WatchAttributeOptionI18nId> {
}
