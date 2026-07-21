package com.shop.vympel.db.repositories.user;

import com.shop.vympel.db.entity.auth.User;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @NonNull
    Page<User> findAll(@NonNull Pageable pageable);

    @Query("""
            select distinct u
            from User u
            left join UserRole ur on ur.user = u
            left join ur.role r
            where lower(coalesce(u.email, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(u.firstName, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(u.lastName, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(u.phone, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(r.code, '')) like lower(concat('%', :search, '%'))
            """)
    Page<User> searchForCrm(@Param("search") String search, Pageable pageable);
}
