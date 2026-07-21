package com.shop.vympel.db.repositories.product;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductRecommendationRepository {
    private static final String SOURCE_SQL = """
            select p.id as product_id,
                   p.brand_id as brand_id,
                   p.price as price,
                   pc.category_id as category_id,
                   c.parent_id as parent_category_id
            from product p
            join product_category pc on pc.product_id = p.id
            join category c on c.id = pc.category_id
            where p.id = :productId
            order by case when c.active then 0 else 1 end, pc.category_id
            """;

    private static final String RANKED_CANDIDATES_SQL = """
            select p.id as product_id,
                   min(
                       case
                           when p.stock_quantity <= 0 then 7
                           when pc.category_id = :categoryId and (
                               exists (
                                   select 1
                                   from watch_details source_watch
                                   join watch_details candidate_watch on candidate_watch.product_id = p.id
                                   where source_watch.product_id = :sourceProductId
                                     and (
                                          (source_watch.mechanism_id is not null and candidate_watch.mechanism_id = source_watch.mechanism_id)
                                       or (source_watch.gender_id is not null and candidate_watch.gender_id = source_watch.gender_id)
                                       or (source_watch.case_material_id is not null and candidate_watch.case_material_id = source_watch.case_material_id)
                                       or (source_watch.strap_material_id is not null and candidate_watch.strap_material_id = source_watch.strap_material_id)
                                       or (source_watch.glass_type_id is not null and candidate_watch.glass_type_id = source_watch.glass_type_id)
                                       or (source_watch.stone_inlay_id is not null and candidate_watch.stone_inlay_id = source_watch.stone_inlay_id)
                                       or (source_watch.case_size_mm is not null and candidate_watch.case_size_mm = source_watch.case_size_mm)
                                     )
                               )
                               or exists (
                                   select 1
                                   from interior_clock_details source_interior
                                   join interior_clock_details candidate_interior on candidate_interior.product_id = p.id
                                   where source_interior.product_id = :sourceProductId
                                     and (
                                          (source_interior.production_country_id is not null and candidate_interior.production_country_id = source_interior.production_country_id)
                                       or (source_interior.case_material_id is not null and candidate_interior.case_material_id = source_interior.case_material_id)
                                       or (source_interior.color_id is not null and candidate_interior.color_id = source_interior.color_id)
                                       or (source_interior.style_id is not null and candidate_interior.style_id = source_interior.style_id)
                                       or (source_interior.mechanism_type_id is not null and candidate_interior.mechanism_type_id = source_interior.mechanism_type_id)
                                       or (source_interior.power_type_id is not null and candidate_interior.power_type_id = source_interior.power_type_id)
                                     )
                               )
                           ) then 1
                           when pc.category_id = :categoryId and p.brand_id = :brandId then 2
                           when pc.category_id = :categoryId and p.price between :priceLower and :priceUpper then 3
                           when %s then 4
                           when %s then 5
                           else 6
                       end
                   ) as recommendation_stage
            from product p
            join product_category pc on pc.product_id = p.id
            join category c on c.id = pc.category_id
            where p.id <> :sourceProductId
              and p.status = 'ACTIVE'
              and c.active = true
              and exists (
                  select 1
                  from product_i18n accessible_name
                  where accessible_name.product_id = p.id
                    and accessible_name.lang in (:language, 'ru')
                    and nullif(trim(accessible_name.name), '') is not null
              )
            group by p.id,
                     p.promotion_mode,
                     p.promoted_until,
                     p.promotion_score,
                     p.created_at
            order by recommendation_stage asc,
                     case
                         when p.promotion_mode <> 'NOT_PROMOTED'
                          and (p.promoted_until is null or p.promoted_until > current_timestamp)
                         then 0 else 1
                     end asc,
                     p.promotion_score desc,
                     p.created_at desc,
                     p.id desc
            """;

    private static final String CARDS_SQL = """
            select p.id as product_id,
                   coalesce(nullif(trim(local_name.name), ''), nullif(trim(ru_name.name), ''), p.model) as product_name,
                   p.model as model,
                   p.price as price,
                   p.stock_quantity as stock_quantity,
                   p.status as status,
                   image.url as image_key,
                   p.kaspi_url as kaspi_url,
                   p.wildberries_url as wildberries_url,
                   col.id as collection_id,
                   coalesce(
                       nullif(trim(local_collection.name), ''),
                       nullif(trim(ru_collection.name), ''),
                       nullif(trim(col.name), ''),
                       col.code
                   ) as collection_name,
                   rating.rating_average as rating_average,
                   coalesce(rating.rating_count, 0) as rating_count
            from product p
            left join product_i18n local_name
                   on local_name.product_id = p.id and local_name.lang = :language
            left join product_i18n ru_name
                   on ru_name.product_id = p.id and ru_name.lang = 'ru'
            left join collection col on col.id = p.collection_id
            left join collection_i18n local_collection
                   on local_collection.collection_id = col.id and local_collection.lang = :language
            left join collection_i18n ru_collection
                   on ru_collection.collection_id = col.id and ru_collection.lang = 'ru'
            left join lateral (
                select media.url
                from media media
                where media.product_id = p.id and media.type = 'IMAGE'
                order by case when media.is_main then 0 else 1 end,
                         media."position" asc,
                         media.id asc
                limit 1
            ) image on true
            left join (
                select review.product_id,
                       avg(review.rating) as rating_average,
                       count(review.id) as rating_count
                from product_review review
                where review.status = 'APPROVED'
                  and review.product_id in (:productIds)
                group by review.product_id
            ) rating on rating.product_id = p.id
            where p.id in (:productIds)
              and p.status = 'ACTIVE'
              and exists (
                  select 1
                  from product_category visible_product_category
                  join category visible_category on visible_category.id = visible_product_category.category_id
                  where visible_product_category.product_id = p.id
                    and visible_category.active = true
              )
              and coalesce(nullif(trim(local_name.name), ''), nullif(trim(ru_name.name), '')) is not null
            """;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.recommendations.query-timeout-ms:1500}")
    private int queryTimeoutMs;

    public Optional<SourceProduct> findSource(Long productId) {
        Query query = timedQuery(SOURCE_SQL)
                .setParameter("productId", productId)
                .setMaxResults(1);

        return tupleResults(query).stream()
                .findFirst()
                .map(tuple -> new SourceProduct(
                        longValue(tuple, "product_id"),
                        longValue(tuple, "brand_id"),
                        bigDecimalValue(tuple, "price"),
                        longValue(tuple, "category_id"),
                        nullableLongValue(tuple, "parent_category_id")
                ));
    }

    public List<RankedCandidate> findRankedCandidateIds(
            SourceProduct source,
            String language,
            BigDecimal priceLower,
            BigDecimal priceUpper,
            int limit
    ) {
        boolean hasParent = source.parentCategoryId() != null;
        String parentStage = hasParent
                ? "pc.category_id = :parentCategoryId"
                : "false";
        String relatedStage = hasParent
                ? "c.parent_id = :parentCategoryId and pc.category_id <> :categoryId"
                : "c.parent_id = :categoryId";
        String sql = RANKED_CANDIDATES_SQL.formatted(parentStage, relatedStage);

        Query query = timedQuery(sql)
                .setParameter("sourceProductId", source.productId())
                .setParameter("categoryId", source.categoryId())
                .setParameter("brandId", source.brandId())
                .setParameter("priceLower", priceLower)
                .setParameter("priceUpper", priceUpper)
                .setParameter("language", language)
                .setMaxResults(limit);

        if (hasParent) {
            query.setParameter("parentCategoryId", source.parentCategoryId());
        }

        return tupleResults(query).stream()
                .map(tuple -> new RankedCandidate(
                        longValue(tuple, "product_id"),
                        intValue(tuple, "recommendation_stage")
                ))
                .toList();
    }

    public List<CardCandidate> findCardsByIds(Collection<Long> productIds, String language) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }

        Query query = timedQuery(CARDS_SQL)
                .setParameter("productIds", productIds)
                .setParameter("language", language);

        return tupleResults(query).stream()
                .map(tuple -> new CardCandidate(
                        longValue(tuple, "product_id"),
                        stringValue(tuple, "product_name"),
                        stringValue(tuple, "model"),
                        bigDecimalValue(tuple, "price"),
                        intValue(tuple, "stock_quantity"),
                        stringValue(tuple, "status"),
                        stringValue(tuple, "image_key"),
                        stringValue(tuple, "kaspi_url"),
                        stringValue(tuple, "wildberries_url"),
                        nullableLongValue(tuple, "collection_id"),
                        stringValue(tuple, "collection_name"),
                        nullableDoubleValue(tuple, "rating_average"),
                        longValue(tuple, "rating_count")
                ))
                .toList();
    }

    private Query timedQuery(String sql) {
        return entityManager
                .createNativeQuery(sql, Tuple.class)
                .setHint("jakarta.persistence.query.timeout", queryTimeoutMs);
    }

    @SuppressWarnings("unchecked")
    private List<Tuple> tupleResults(Query query) {
        return (List<Tuple>) query.getResultList();
    }

    private Long longValue(Tuple tuple, String alias) {
        return ((Number) tuple.get(alias)).longValue();
    }

    private Long nullableLongValue(Tuple tuple, String alias) {
        Object value = tuple.get(alias);
        return value == null ? null : ((Number) value).longValue();
    }

    private int intValue(Tuple tuple, String alias) {
        return ((Number) tuple.get(alias)).intValue();
    }

    private Double nullableDoubleValue(Tuple tuple, String alias) {
        Object value = tuple.get(alias);
        return value == null ? null : ((Number) value).doubleValue();
    }

    private BigDecimal bigDecimalValue(Tuple tuple, String alias) {
        Object value = tuple.get(alias);
        return value instanceof BigDecimal decimal ? decimal : new BigDecimal(value.toString());
    }

    private String stringValue(Tuple tuple, String alias) {
        Object value = tuple.get(alias);
        return value == null ? null : value.toString();
    }

    public record SourceProduct(
            Long productId,
            Long brandId,
            BigDecimal price,
            Long categoryId,
            Long parentCategoryId
    ) {
    }

    public record RankedCandidate(Long productId, int stage) {
    }

    public record CardCandidate(
            Long productId,
            String name,
            String model,
            BigDecimal price,
            Integer stockQuantity,
            String status,
            String imageKey,
            String kaspiUrl,
            String wildberriesUrl,
            Long collectionId,
            String collectionName,
            Double ratingAverage,
            Long ratingCount
    ) {
    }
}
