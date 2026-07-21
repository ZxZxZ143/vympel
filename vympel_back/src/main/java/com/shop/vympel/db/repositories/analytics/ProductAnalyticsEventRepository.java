package com.shop.vympel.db.repositories.analytics;

import com.shop.vympel.db.entity.analytics.ProductAnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ProductAnalyticsEventRepository extends JpaRepository<ProductAnalyticsEvent, Long> {
    @Query(value = "select pg_try_advisory_xact_lock(1448231041)", nativeQuery = true)
    boolean tryAcquireRetentionLock();

    @Query(value = "select count(*) from product_analytics_event where created_at < :cutoff", nativeQuery = true)
    long countExpired(@Param("cutoff") Instant cutoff);

    @Modifying
    @Query(value = """
            delete from product_analytics_event
            where id in (
                select id
                from product_analytics_event
                where created_at < :cutoff
                order by id
                limit :batchSize
            )
            """, nativeQuery = true)
    int deleteExpiredBatch(@Param("cutoff") Instant cutoff, @Param("batchSize") int batchSize);

    @Query("""
            select p.id as productId,
                   p.sku as sku,
                   coalesce(max(pi.name), p.model) as name,
                   p.model as model,
                   p.stockQuantity as stockQuantity,
                   p.status as status,
                   p.promotionMode as promotionMode,
                   p.promotionScore as promotionScore,
                   p.promotedUntil as promotedUntil,
                   coalesce(sum(case when e.eventType = 'VIEW' then 1 else 0 end), 0) as views,
                   coalesce(sum(case when e.eventType = 'FAVORITE' then 1 else 0 end), 0) as favorites,
                   coalesce(sum(case when e.eventType = 'ADD_TO_CART' then 1 else 0 end), 0) as cartAdditions
            from Product p
            left join ProductI18n pi on pi.product = p and pi.id.lang = :lang
            left join ProductAnalyticsEvent e on e.product = p
            group by p.id, p.sku, p.model, p.stockQuantity, p.status, p.promotionMode, p.promotionScore, p.promotedUntil
            """)
    List<ProductPopularityProjection> aggregatePopularity(
            @Param("lang") String lang
    );

    @Query("""
            select p.id as productId,
                   p.sku as sku,
                   coalesce(max(pi.name), p.model) as name,
                   p.model as model,
                   p.stockQuantity as stockQuantity,
                   p.status as status,
                   p.promotionMode as promotionMode,
                   p.promotionScore as promotionScore,
                   p.promotedUntil as promotedUntil,
                   coalesce(sum(case when e.eventType = 'VIEW' then 1 else 0 end), 0) as views,
                   coalesce(sum(case when e.eventType = 'FAVORITE' then 1 else 0 end), 0) as favorites,
                   coalesce(sum(case when e.eventType = 'ADD_TO_CART' then 1 else 0 end), 0) as cartAdditions
            from Product p
            left join ProductI18n pi on pi.product = p and pi.id.lang = :lang
            left join ProductAnalyticsEvent e on e.product = p and e.createdAt >= :since
            group by p.id, p.sku, p.model, p.stockQuantity, p.status, p.promotionMode, p.promotionScore, p.promotedUntil
            """)
    List<ProductPopularityProjection> aggregatePopularitySince(
            @Param("since") Instant since,
            @Param("lang") String lang
    );
}
