package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.Material;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository extends JpaRepository<Material, Long> {
}
