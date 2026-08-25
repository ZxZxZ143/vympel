package com.shop.vympel.db.repositories;

import com.shop.vympel.db.entity.CustomerRequest;
import com.shop.vympel.enums.CustomerRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface CustomerRequestRepository
        extends JpaRepository<CustomerRequest, Long>, JpaSpecificationExecutor<CustomerRequest> {
    @Override
    @EntityGraph(attributePaths = "processedBy")
    Page<CustomerRequest> findAll(Specification<CustomerRequest> specification, Pageable pageable);
    long countByStatus(CustomerRequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from CustomerRequest request where request.id = :id")
    Optional<CustomerRequest> findByIdForUpdate(@Param("id") Long id);
}
