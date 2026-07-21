package com.shop.vympel.db.repositories.user;

import com.shop.vympel.db.entity.auth.UserRole;
import com.shop.vympel.db.entity.auth.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    List<UserRole> findByUserId(Long userId);

    void deleteByUserId(Long userId);

    @Query("""
            select count(distinct ur.user.id)
            from UserRole ur
            where ur.role.code = 'ADMIN'
              and ur.user.enabled = true
            """)
    long countActiveAdmins();
}
