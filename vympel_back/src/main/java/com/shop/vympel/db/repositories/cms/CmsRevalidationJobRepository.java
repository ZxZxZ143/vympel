package com.shop.vympel.db.repositories.cms;

import com.shop.vympel.db.entity.cms.CmsRevalidationJob;
import com.shop.vympel.enums.CmsRevalidationJobStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CmsRevalidationJobRepository extends JpaRepository<CmsRevalidationJob, Long> {
    @Modifying
    @Query(value = """
            INSERT INTO cms_revalidation_job (
                page_key, request_id, status, attempt_count, next_attempt_at,
                locked_at, last_attempt_at, completed_at, last_error_code, created_at, updated_at
            ) VALUES (
                :pageKey, :requestId, 'PENDING', 0, :now,
                NULL, NULL, NULL, NULL, :now, :now
            )
            ON CONFLICT (page_key) DO UPDATE SET
                request_id = EXCLUDED.request_id,
                status = 'PENDING',
                attempt_count = 0,
                next_attempt_at = EXCLUDED.next_attempt_at,
                locked_at = NULL,
                last_attempt_at = NULL,
                completed_at = NULL,
                last_error_code = NULL,
                updated_at = EXCLUDED.updated_at
            """, nativeQuery = true)
    void enqueue(@Param("pageKey") String pageKey, @Param("requestId") String requestId, @Param("now") Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select job from CmsRevalidationJob job where job.pageKey = :pageKey")
    Optional<CmsRevalidationJob> findByPageKeyForUpdate(@Param("pageKey") String pageKey);

    @Query("""
            select job.pageKey from CmsRevalidationJob job
            where (job.status in :dueStatuses and job.nextAttemptAt <= :now)
               or (job.status = com.shop.vympel.enums.CmsRevalidationJobStatus.PROCESSING
                   and job.lockedAt <= :staleBefore)
            order by job.nextAttemptAt, job.id
            """)
    List<String> findDuePageKeys(
            @Param("dueStatuses") Collection<CmsRevalidationJobStatus> dueStatuses,
            @Param("now") Instant now,
            @Param("staleBefore") Instant staleBefore,
            Pageable pageable
    );
}
