package com.shop.vympel.db.repositories.review;

import com.shop.vympel.db.entity.review.ProductReview;
import com.shop.vympel.enums.ProductReviewStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository
        extends JpaRepository<ProductReview, Long>, JpaSpecificationExecutor<ProductReview> {

    @Override
    @EntityGraph(attributePaths = {"product", "moderatedBy"})
    Page<ProductReview> findAll(Specification<ProductReview> specification, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select review from ProductReview review where review.id = :id")
    Optional<ProductReview> findByIdForUpdate(@Param("id") Long id);

    List<ProductReview> findAllByProductIdAndStatusOrderByCreatedAtDesc(
            Long productId,
            ProductReviewStatus status
    );

    long countByStatus(ProductReviewStatus status);

    @Query("""
            select r.product.id as productId,
                   avg(r.rating) as ratingAverage,
                   count(r.id) as ratingCount
            from ProductReview r
            where r.status = :status
              and r.product.id in :productIds
            group by r.product.id
            """)
    List<ProductRatingProjection> findRatingSummaries(
            @Param("productIds") Collection<Long> productIds,
            @Param("status") ProductReviewStatus status
    );
}
