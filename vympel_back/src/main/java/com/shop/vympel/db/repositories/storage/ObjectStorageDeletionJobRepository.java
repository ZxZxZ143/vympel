package com.shop.vympel.db.repositories.storage;

import com.shop.vympel.db.entity.storage.ObjectStorageDeletionJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ObjectStorageDeletionJobRepository extends JpaRepository<ObjectStorageDeletionJob, Long> {
    @Modifying
    @Query(value = """
            insert into object_storage_deletion_job
                (object_key, status, attempt_count, next_attempt_at, created_at, updated_at)
            values (:objectKey, 'PENDING', 0, now(), now(), now())
            on conflict (object_key) do nothing
            """, nativeQuery = true)
    void enqueue(@Param("objectKey") String objectKey);

    @Query(value = """
            select * from object_storage_deletion_job
            where status = 'PENDING' and next_attempt_at <= :now
            order by id
            for update skip locked
            limit :batchSize
            """, nativeQuery = true)
    List<ObjectStorageDeletionJob> findDueForUpdate(
            @Param("now") Instant now,
            @Param("batchSize") int batchSize
    );

    @Query(value = "select * from object_storage_deletion_job where id = :id for update", nativeQuery = true)
    Optional<ObjectStorageDeletionJob> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query(value = """
            update object_storage_deletion_job
            set status = 'PENDING', updated_at = now()
            where status = 'PROCESSING' and updated_at < :staleBefore
            """, nativeQuery = true)
    int releaseStaleClaims(@Param("staleBefore") Instant staleBefore);
}
