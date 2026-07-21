package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface BrandCountryRepository extends Repository<BrandCountry, BrandCountryId> {
    List<BrandCountry> findByBrand(Brand brand);
}
