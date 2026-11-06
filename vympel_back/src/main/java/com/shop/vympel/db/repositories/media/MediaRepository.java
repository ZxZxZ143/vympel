package com.shop.vympel.db.repositories.media;

import com.shop.vympel.db.entity.product.Media;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MediaRepository extends JpaRepository<Media, Long> {
    @Query(value = """
            select exists (
              select 1 from media owned
              where owned.product_id = :productId and (
                exists (select 1 from media other where other.url = owned.url and other.product_id <> :productId)
                or exists (select 1 from cms_media cms where cms.object_key = owned.url)
                or exists (select 1 from cms_banner_media link where link.media_id = owned.id)
              )
            )
            """, nativeQuery = true)
    boolean hasExternalProductMediaReferences(@Param("productId") Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select media from Media media where media.product.id = :productId order by media.id")
    List<Media> findAllOwnedByProductIdForUpdate(@Param("productId") Long productId);

    List<Media> findByProduct_Id(Long product_id);

    @Query("select media.product.id from Media media where media.id = :mediaId")
    Optional<Long> findProductIdByMediaId(@Param("mediaId") Long mediaId);

    /** Product images that are not yet a responsive family, in stable id order. */
    @Query("""
            select new com.shop.vympel.db.repositories.media.MediaKeyCandidate(media.id, media.url)
            from Media media
            where media.type = 'IMAGE' and media.id > :afterId and media.url not like '%responsive-v1/%'
            order by media.id
            """)
    List<MediaKeyCandidate> findResponsiveCandidates(@Param("afterId") long afterId, Pageable pageable);

    /** A key used by another media row, a CMS media row or a CMS banner link is never rewritten alone. */
    @Query(value = """
            select exists (select 1 from media other where other.url = :url and other.id <> :mediaId)
                or exists (select 1 from cms_media cms where cms.object_key = :url)
                or exists (select 1 from cms_banner_media link where link.media_id = :mediaId)
            """, nativeQuery = true)
    boolean isProductMediaKeyShared(@Param("mediaId") Long mediaId, @Param("url") String url);

    List<Media> findByProduct_IdAndTypeOrderByPositionAscIdAsc(Long productId, String type);

    Optional<Media> findFirstByProduct_Id(Long product_id);

    Optional<Media> findFirstByProduct_IdAndTypeAndMainTrue(Long productId, String type);

    Optional<Media> findFirstByProduct_IdAndTypeOrderByPositionAscIdAsc(Long productId, String type);

    Optional<Media> findByIdAndProduct_Id(Long id, Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select media
            from Media media
            where media.product.id = :productId and media.type = 'IMAGE'
            order by media.position asc, media.id asc
            """)
    List<Media> findAllByProductIdForUpdate(@Param("productId") Long productId);
}
