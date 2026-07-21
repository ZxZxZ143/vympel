package com.shop.vympel.db.repositories;

import com.shop.vympel.db.entity.CustomerRequest;
import com.shop.vympel.enums.CustomerRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerRequestRepository
        extends JpaRepository<CustomerRequest, Long>, JpaSpecificationExecutor<CustomerRequest> {
    long countByStatus(CustomerRequestStatus status);
}
