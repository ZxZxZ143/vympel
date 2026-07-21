package com.shop.vympel.db.repositories.audit;

import com.shop.vympel.db.entity.audit.CrmActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrmActivityRepository extends JpaRepository<CrmActivity, Long> {
    Page<CrmActivity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
