package com.shop.vympel.db.repositories.product.watchDetail;

import com.shop.vympel.db.entity.product.InteriorClockDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InteriorClockDetailRepository extends JpaRepository<InteriorClockDetail, Long> {
    Optional<InteriorClockDetail> findByProduct_Id(Long productId);
}
