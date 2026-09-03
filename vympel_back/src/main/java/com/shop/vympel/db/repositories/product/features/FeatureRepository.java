package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.WatchFeature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeatureRepository extends JpaRepository<WatchFeature, Long> {
    List<WatchFeature> findByActiveTrueOrderByCodeAsc();
}
