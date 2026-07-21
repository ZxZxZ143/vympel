package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.InteriorFeature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InteriorFeatureRepository extends JpaRepository<InteriorFeature, Long> {
    List<InteriorFeature> findByFeatureTypeAndActiveTrueOrderByCodeAsc(String featureType);
}
