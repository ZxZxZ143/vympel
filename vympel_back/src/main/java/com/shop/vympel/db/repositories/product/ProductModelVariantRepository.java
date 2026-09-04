package com.shop.vympel.db.repositories.product;

import com.shop.vympel.db.entity.product.Product;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductModelVariantRepository extends Repository<Product, Long> {
    @Query(value = """
            WITH RECURSIVE
            anchor AS (
                SELECT p.id, p.brand_id, upper(btrim(p.model)) AS normalized_model
                FROM product p
                WHERE p.id IN (:anchorIds)
                  AND btrim(p.model) <> ''
            ),
            candidate AS (
                SELECT
                    anchor.id AS anchor_id,
                    product.id,
                    anchor.normalized_model AS model,
                    product.status
                FROM anchor
                JOIN product
                  ON product.brand_id = anchor.brand_id
                 AND upper(btrim(product.model)) = anchor.normalized_model
            ),
            relevant_product AS (
                SELECT DISTINCT id AS product_id FROM candidate
                UNION
                SELECT id AS product_id FROM anchor
            ),
            category_path AS (
                SELECT
                    product_category.product_id,
                    upper(replace(category.code, '-', '_')) AS category_code,
                    category.parent_id,
                    category.active
                FROM relevant_product
                JOIN product_category ON product_category.product_id = relevant_product.product_id
                JOIN category ON category.id = product_category.category_id

                UNION ALL

                SELECT
                    category_path.product_id,
                    upper(replace(parent.code, '-', '_')) AS category_code,
                    parent.parent_id,
                    parent.active
                FROM category_path
                JOIN category parent ON parent.id = category_path.parent_id
            ),
            product_profile AS (
                SELECT
                    product_id,
                    CASE
                        WHEN bool_or(category_code IN (
                            'WATCH_WRIST', 'WATCH_MEN', 'WATCH_WOMEN', 'WATCH_UNISEX',
                            'SMARTWATCH', 'WATCH_KIDS', 'WATCH_CLASSIC', 'WATCH_SPORT',
                            'WATCH_DIVER', 'WATCH_CHRONOGRAPH'
                        )) THEN 'WRISTWATCH'
                        WHEN bool_or(category_code IN ('WATCH_INTERIOR', 'WATCH_WALL', 'WATCH_FLOOR'))
                            THEN 'INTERIOR_CLOCK'
                        WHEN bool_or(category_code IN ('ACCESSORIES', 'ACCESSORY', 'APPLE_CASE'))
                            THEN 'ACCESSORY'
                        ELSE 'GENERIC'
                    END AS category_profile,
                    bool_and(active) AND bool_or(parent_id IS NULL) AS publicly_visible
                FROM category_path
                GROUP BY product_id
            ),
            ranked_variant AS (
                SELECT
                    candidate.anchor_id AS "anchorId",
                    candidate.id AS "id",
                    coalesce(
                        (SELECT product_i18n.name
                         FROM product_i18n
                         WHERE product_i18n.product_id = candidate.id
                           AND product_i18n.lang = :lang
                         LIMIT 1),
                        (SELECT product_i18n.name
                         FROM product_i18n
                         WHERE product_i18n.product_id = candidate.id
                           AND product_i18n.lang = 'ru'
                         LIMIT 1),
                        candidate.model
                    ) AS "name",
                    candidate.model AS "model",
                    candidate.status AS "status",
                    primary_image.id AS "imageId",
                    primary_image.url AS "imageKey",
                    primary_image.position AS "imageSortOrder",
                    primary_image.is_main AS "imageMain",
                    count(*) OVER (PARTITION BY candidate.anchor_id) AS "variantCount",
                    row_number() OVER (
                        PARTITION BY candidate.anchor_id
                        ORDER BY CASE WHEN candidate.id = candidate.anchor_id THEN 0 ELSE 1 END, candidate.id
                    ) AS "variantOrder"
                FROM candidate
                JOIN product_profile candidate_profile ON candidate_profile.product_id = candidate.id
                JOIN product_profile anchor_profile ON anchor_profile.product_id = candidate.anchor_id
                LEFT JOIN LATERAL (
                    SELECT media.id, media.url, media.position, media.is_main
                    FROM media
                    WHERE media.product_id = candidate.id
                      AND media.type = 'IMAGE'
                    ORDER BY media.is_main DESC, media.position ASC, media.id ASC
                    LIMIT 1
                ) primary_image ON true
                WHERE candidate_profile.category_profile = anchor_profile.category_profile
                  AND (
                    :publicOnly = false
                    OR (candidate.status = 'ACTIVE' AND candidate_profile.publicly_visible = true)
                  )
            )
            SELECT *
            FROM ranked_variant
            WHERE "variantOrder" <= :variantLimit
            ORDER BY "anchorId", "variantOrder"
            """, nativeQuery = true)
    List<ProductModelVariantRow> findModelVariantRows(
            @Param("anchorIds") Collection<Long> anchorIds,
            @Param("lang") String language,
            @Param("publicOnly") boolean publicOnly,
            @Param("variantLimit") int variantLimit
    );
}
