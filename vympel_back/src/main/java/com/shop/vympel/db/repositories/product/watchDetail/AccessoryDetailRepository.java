package com.shop.vympel.db.repositories.product.watchDetail;

import com.shop.vympel.db.entity.product.AccessoryDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccessoryDetailRepository extends JpaRepository<AccessoryDetail, Long> {
    Optional<AccessoryDetail> findByProduct_Id(Long productId);
}
