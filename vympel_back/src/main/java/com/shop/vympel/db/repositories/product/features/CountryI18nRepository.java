package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.CountryI18n;
import com.shop.vympel.db.entity.features.CountryI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CountryI18nRepository extends JpaRepository<CountryI18n, CountryI18nId> {
}