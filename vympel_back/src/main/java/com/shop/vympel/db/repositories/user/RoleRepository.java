package com.shop.vympel.db.repositories.user;

import com.shop.vympel.db.entity.auth.Role;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCodeAndActiveTrue(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select role from Role role where role.code = :code")
    Optional<Role> findByCodeForUpdate(@Param("code") String code);

    List<Role> findByActiveTrueOrderByCodeAsc();
}
