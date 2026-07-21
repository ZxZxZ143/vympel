package com.shop.vympel.db.repositories.category;

import com.shop.vympel.db.entity.i18n.CategoryI18n;
import com.shop.vympel.db.entity.i18n.CategoryI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryI18Repository extends JpaRepository<CategoryI18n, CategoryI18nId> {
}
