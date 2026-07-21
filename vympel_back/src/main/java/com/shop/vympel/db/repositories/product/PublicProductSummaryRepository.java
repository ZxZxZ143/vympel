package com.shop.vympel.db.repositories.product;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository
public class PublicProductSummaryRepository {
    private static final String SUMMARIES_SQL = """
            select p.id as product_id,
                   coalesce(nullif(trim(local_name.name), ''), nullif(trim(ru_name.name), ''), p.model) as product_name,
                   p.model as model,
                   p.sku as sku,
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
                   p.brand_id as brand_id,
                   coalesce(nullif(trim(brand.name), ''), brand.code) as brand_name,
                   visible_category.category_code as category_code,
                   visible_category.category_name as category_name,
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
            join brand on brand.id = p.brand_id
            left join lateral (
                select media.url
                from media media
                where media.product_id = p.id and media.type = 'IMAGE'
                order by case when media.is_main then 0 else 1 end,
                         media."position" asc,
                         media.id asc
                limit 1
            ) image on true
            join lateral (
                select category.code as category_code,
                       coalesce(
                           nullif(trim(local_category.name), ''),
                           nullif(trim(ru_category.name), ''),
                           category.code
                       ) as category_name
                from product_category product_category
                join category category on category.id = product_category.category_id and category.active = true
                left join category_i18n local_category
                       on local_category.category_id = category.id and local_category.lang = :language
                left join category_i18n ru_category
                       on ru_category.category_id = category.id and ru_category.lang = 'ru'
                where product_category.product_id = p.id
                order by case when category.parent_id is not null then 0 else 1 end,
                         category.id
                limit 1
            ) visible_category on true
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
              and coalesce(nullif(trim(local_name.name), ''), nullif(trim(ru_name.name), '')) is not null
            """;

    @PersistenceContext
    private EntityManager entityManager;

    public List<PublicProductSummary> findAllByIds(Collection<Long> productIds, String language) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }

        Query query = entityManager.createNativeQuery(SUMMARIES_SQL, Tuple.class)
                .setParameter("productIds", productIds)
                .setParameter("language", language)
                .setHint("jakarta.persistence.query.timeout", 2000);

        return tupleResults(query).stream()
                .map(tuple -> new PublicProductSummary(
                        longValue(tuple, "product_id"),
                        stringValue(tuple, "product_name"),
                        stringValue(tuple, "model"),
                        stringValue(tuple, "sku"),
                        bigDecimalValue(tuple, "price"),
                        intValue(tuple, "stock_quantity"),
                        stringValue(tuple, "status"),
                        stringValue(tuple, "image_key"),
                        stringValue(tuple, "kaspi_url"),
                        stringValue(tuple, "wildberries_url"),
                        nullableLongValue(tuple, "collection_id"),
                        stringValue(tuple, "collection_name"),
                        nullableLongValue(tuple, "brand_id"),
                        stringValue(tuple, "brand_name"),
                        stringValue(tuple, "category_code"),
                        stringValue(tuple, "category_name"),
                        nullableDoubleValue(tuple, "rating_average"),
                        longValue(tuple, "rating_count")
                ))
                .toList();
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

    public record PublicProductSummary(
            Long productId,
            String name,
            String model,
            String sku,
            BigDecimal price,
            Integer stockQuantity,
            String status,
            String imageKey,
            String kaspiUrl,
            String wildberriesUrl,
            Long collectionId,
            String collectionName,
            Long brandId,
            String brandName,
            String categoryCode,
            String categoryName,
            Double ratingAverage,
            Long ratingCount
    ) {
    }
}
