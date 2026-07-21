package com.shop.vympel.db.repositories;

import com.shop.vympel.db.entity.features.Country;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CountryRepository extends JpaRepository<Country, Long> {
}
