package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.Gender;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenderRepository extends JpaRepository<Gender, Long> {
}
