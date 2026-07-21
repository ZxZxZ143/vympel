package com.shop.vympel.db.repositories.cms;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CmsMediaRepository extends JpaRepository<CmsMedia, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select media from CmsMedia media where media.id = :mediaId")
    Optional<CmsMedia> findByIdForUpdate(@Param("mediaId") Long mediaId);

    @Query(value = """
            SELECT COUNT(*)
            FROM cms_block block
            WHERE block.media_id = :mediaId
               OR block.media_kz_id = :mediaId
               OR block.media_en_id = :mediaId
               OR block.mobile_media_id = :mediaId
               OR block.mobile_media_kz_id = :mediaId
               OR block.mobile_media_en_id = :mediaId
            """, nativeQuery = true)
    long countReferences(@Param("mediaId") Long mediaId);

    @Query(value = """
            SELECT refs.block_id AS blockId,
                   refs.block_key AS blockKey,
                   refs.page_key AS pageKey,
                   refs.block_status AS blockStatus,
                   refs.slot AS slot
            FROM (
                SELECT block.id AS block_id, block.block_key, page.page_key,
                       block.status AS block_status, 'media' AS slot
                FROM cms_block block JOIN cms_page page ON page.id = block.page_id
                WHERE block.media_id = :mediaId
                UNION ALL
                SELECT block.id, block.block_key, page.page_key, block.status, 'mediaKz'
                FROM cms_block block JOIN cms_page page ON page.id = block.page_id
                WHERE block.media_kz_id = :mediaId
                UNION ALL
                SELECT block.id, block.block_key, page.page_key, block.status, 'mediaEn'
                FROM cms_block block JOIN cms_page page ON page.id = block.page_id
                WHERE block.media_en_id = :mediaId
                UNION ALL
                SELECT block.id, block.block_key, page.page_key, block.status, 'mobileMedia'
                FROM cms_block block JOIN cms_page page ON page.id = block.page_id
                WHERE block.mobile_media_id = :mediaId
                UNION ALL
                SELECT block.id, block.block_key, page.page_key, block.status, 'mobileMediaKz'
                FROM cms_block block JOIN cms_page page ON page.id = block.page_id
                WHERE block.mobile_media_kz_id = :mediaId
                UNION ALL
                SELECT block.id, block.block_key, page.page_key, block.status, 'mobileMediaEn'
                FROM cms_block block JOIN cms_page page ON page.id = block.page_id
                WHERE block.mobile_media_en_id = :mediaId
            ) refs
            ORDER BY refs.page_key, refs.block_id, refs.slot
            LIMIT :limit
            """, nativeQuery = true)
    List<CmsMediaReferenceProjection> findReferences(
            @Param("mediaId") Long mediaId,
            @Param("limit") int limit
    );

    @Query("""
            select media
            from CmsMedia media
            where media.storageType = com.shop.vympel.enums.CmsMediaStorageType.OBJECT_STORAGE
              and media.cleanupProtected = false
              and media.lifecycleStatus in :statuses
              and (media.lifecycleStatus <> com.shop.vympel.enums.CmsMediaLifecycleStatus.DELETE_PENDING
                   or media.deleteRequestedAt <= :staleDeleteBefore)
              and coalesce(media.orphanedAt, media.createdAt) <= :cutoff
              and (media.nextDeleteAttemptAt is null or media.nextDeleteAttemptAt <= :now)
              and not exists (
                  select block.id from CmsBlock block
                  where block.media = media
                     or block.mediaKz = media
                     or block.mediaEn = media
                     or block.mobileMedia = media
                     or block.mobileMediaKz = media
                     or block.mobileMediaEn = media
              )
            order by coalesce(media.orphanedAt, media.createdAt), media.id
            """)
    Page<CmsMedia> findCleanupCandidates(
            @Param("statuses") Collection<CmsMediaLifecycleStatus> statuses,
            @Param("cutoff") Instant cutoff,
            @Param("now") Instant now,
            @Param("staleDeleteBefore") Instant staleDeleteBefore,
            Pageable pageable
    );
}
