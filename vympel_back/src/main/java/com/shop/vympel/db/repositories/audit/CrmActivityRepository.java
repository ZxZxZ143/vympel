package com.shop.vympel.db.repositories.audit;

import com.shop.vympel.db.entity.audit.CrmActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface CrmActivityRepository extends JpaRepository<CrmActivity, Long> {
    Page<CrmActivity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query(value = "select pg_try_advisory_xact_lock(1448231042)", nativeQuery = true)
    boolean tryAcquireRetentionLock();

    @Query(value = "select count(*) from crm_activity where created_at < :cutoff", nativeQuery = true)
    long countExpired(@Param("cutoff") Instant cutoff);

    @Modifying
    @Query(value = """
            delete from crm_activity
            where id in (
                select id
                from crm_activity
                where created_at < :cutoff
                order by id
                limit :batchSize
            )
            """, nativeQuery = true)
    int deleteExpiredBatch(@Param("cutoff") Instant cutoff, @Param("batchSize") int batchSize);
}
