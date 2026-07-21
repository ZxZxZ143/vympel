package com.shop.vympel.db.repositories.user;

import com.shop.vympel.db.entity.auth.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCodeAndActiveTrue(String code);

    List<Role> findByActiveTrueOrderByCodeAsc();
}
