package com.shop.vympel.db.repositories.media;

import com.shop.vympel.db.entity.product.Media;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByProduct_Id(Long product_id);

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
