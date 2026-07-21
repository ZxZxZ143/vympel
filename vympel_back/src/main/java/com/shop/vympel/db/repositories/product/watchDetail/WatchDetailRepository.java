package com.shop.vympel.db.repositories.product.watchDetail;

import com.shop.vympel.db.entity.product.WatchDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WatchDetailRepository extends JpaRepository<WatchDetail, Long> {
    Optional<WatchDetail> findByProduct_Id(Long productId);
}

