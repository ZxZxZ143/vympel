package com.shop.vympel.db.repositories.user;

import com.shop.vympel.db.entity.auth.RefreshTokenSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenSessionRepository extends JpaRepository<RefreshTokenSession, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select session
            from RefreshTokenSession session
            join fetch session.user
            where session.tokenHash = :tokenHash
            """)
    Optional<RefreshTokenSession> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update RefreshTokenSession session
            set session.revokedAt = :revokedAt,
                session.revocationReason = :reason
            where session.familyId = :familyId
              and session.revokedAt is null
            """)
    int revokeActiveByFamilyId(
            @Param("familyId") String familyId,
            @Param("revokedAt") Instant revokedAt,
            @Param("reason") String reason
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update RefreshTokenSession session
            set session.revokedAt = :revokedAt,
                session.revocationReason = :reason
            where session.user.id = :userId
              and session.revokedAt is null
            """)
    int revokeActiveByUserId(
            @Param("userId") Long userId,
            @Param("revokedAt") Instant revokedAt,
            @Param("reason") String reason
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            delete from RefreshTokenSession session
            where session.expiresAt < :cutoff
               or (session.revokedAt is not null and session.revokedAt < :cutoff)
            """)
    int deleteRetiredBefore(@Param("cutoff") Instant cutoff);
}
