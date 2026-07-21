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
public class CatalogFacetRepository {
    private static final String SCOPE = """
            with scoped as (
                select p.id, p.price, p.brand_id
                from product p
                where p.status = 'ACTIVE'
                  and (:scopeAll = true or exists (
                      select 1 from product_category pc
                      where pc.product_id = p.id and pc.category_id in (:categoryIds)
                  ))
            )
            """;

    private static final String BASE_SQL = SCOPE + """
            select 'price' as facet_key, null::text as facet_value, null::text as facet_label,
                   count(*)::bigint as option_count, min(price) as min_value, max(price) as max_value
            from scoped
            union all
            select 'brand', b.id::text, coalesce(nullif(trim(b.name), ''), b.code),
                   count(s.id)::bigint, null::numeric, null::numeric
            from brand b left join scoped s on s.brand_id = b.id
            group by b.id, b.name, b.code
            union all
            select 'country', c.id::text,
                   coalesce(nullif(trim(local_name.name), ''), nullif(trim(ru_name.name), ''), c.code),
                   count(s.id)::bigint, null::numeric, null::numeric
            from country c
            left join country_i18n local_name on local_name.country_id = c.id and local_name.lang = :language
            left join country_i18n ru_name on ru_name.country_id = c.id and ru_name.lang = 'ru'
left join brand_country bc on bc.country_id = c.id
left join scoped s on s.brand_id = bc.brand_id
            where c.active = true
            group by c.id, c.code, local_name.name, ru_name.name
            """;

    private static final String WRIST_SQL = SCOPE + """
            , details as (
                select wd.* from watch_details wd join scoped s on s.id = wd.product_id
            )
            select 'mechanism' as facet_key, r.id::text as facet_value,
                   coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code) as facet_label,
                   count(d.product_id)::bigint as option_count, null::numeric as min_value, null::numeric as max_value
            from watch_mechanism r join details d on d.mechanism_id = r.id
            left join watch_mechanism_i18n l on l.mechanism_id = r.id and l.lang = :language
            left join watch_mechanism_i18n ru on ru.mechanism_id = r.id and ru.lang = 'ru'
            group by r.id, r.code, l.name, ru.name
            union all
            select 'gender', r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(d.product_id)::bigint, null::numeric, null::numeric
            from gender r join details d on d.gender_id = r.id
            left join gender_i18n l on l.gender_id = r.id and l.lang = :language
            left join gender_i18n ru on ru.gender_id = r.id and ru.lang = 'ru'
            group by r.id, r.code, l.name, ru.name
            union all
            select x.facet_key, r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(x.product_id)::bigint, null::numeric, null::numeric
            from (
                select product_id, case_material_id as material_id, 'caseMaterial'::text as facet_key from details
                union all select product_id, strap_material_id, 'strapMaterial' from details
            ) x join material r on r.id = x.material_id
            left join material_i18n l on l.material_id = r.id and l.lang = :language
            left join material_i18n ru on ru.material_id = r.id and ru.lang = 'ru'
            group by x.facet_key, r.id, r.code, l.name, ru.name
            union all
            select 'glassType', r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(d.product_id)::bigint, null::numeric, null::numeric
            from glass_type r join details d on d.glass_type_id = r.id
            left join glass_type_i18n l on l.glass_type_id = r.id and l.lang = :language
            left join glass_type_i18n ru on ru.glass_type_id = r.id and ru.lang = 'ru'
            group by r.id, r.code, l.name, ru.name
            union all
            select 'stoneInlay', r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(d.product_id)::bigint, null::numeric, null::numeric
            from stone_inlay r join details d on d.stone_inlay_id = r.id
            left join stone_inlay_i18n l on l.stone_inlay_id = r.id and l.lang = :language
            left join stone_inlay_i18n ru on ru.stone_inlay_id = r.id and ru.lang = 'ru'
            group by r.id, r.code, l.name, ru.name
            union all
            select 'caseSize', trim(trailing '.' from trim(trailing '0' from d.case_size_mm::text)),
                   trim(trailing '.' from trim(trailing '0' from d.case_size_mm::text)),
                   count(d.product_id)::bigint, null::numeric, null::numeric
            from details d where d.case_size_mm is not null
            group by d.case_size_mm
            """;

    private static final String INTERIOR_SQL = SCOPE + """
            , details as (
                select icd.* from interior_clock_details icd join scoped s on s.id = icd.product_id
            ), refs as (
                select product_id, case_material_id as ref_id, 'interiorCaseMaterial'::text as facet_key, 'material'::text as ref_type from details
                union all select product_id, color_id, 'interiorColor', 'feature' from details
                union all select product_id, style_id, 'interiorStyle', 'feature' from details
                union all select product_id, mechanism_type_id, 'interiorMechanismType', 'feature' from details
                union all select product_id, power_type_id, 'powerType', 'feature' from details
            )
            select refs.facet_key, refs.ref_id::text as facet_value,
                   coalesce(nullif(trim(mi.name), ''), nullif(trim(mru.name), ''),
                            nullif(trim(fi.name), ''), nullif(trim(fru.name), ''),
                            m.code, f.code) as facet_label,
                   count(refs.product_id)::bigint as option_count, null::numeric as min_value, null::numeric as max_value
            from refs
            left join material m on refs.ref_type = 'material' and m.id = refs.ref_id
            left join material_i18n mi on mi.material_id = m.id and mi.lang = :language
            left join material_i18n mru on mru.material_id = m.id and mru.lang = 'ru'
            left join interior_feature f on refs.ref_type = 'feature' and f.id = refs.ref_id
            left join interior_feature_i18n fi on fi.feature_id = f.id and fi.lang = :language
            left join interior_feature_i18n fru on fru.feature_id = f.id and fru.lang = 'ru'
            where refs.ref_id is not null
            group by refs.facet_key, refs.ref_id, mi.name, mru.name, fi.name, fru.name, m.code, f.code
            """;

    @PersistenceContext
    private EntityManager entityManager;

    public List<FacetRow> findBaseFacets(Collection<Long> categoryIds, String language) {
        return execute(BASE_SQL, categoryIds, language);
    }

    public List<FacetRow> findWristFacets(Collection<Long> categoryIds, String language) {
        return execute(WRIST_SQL, categoryIds, language);
    }

    public List<FacetRow> findInteriorFacets(Collection<Long> categoryIds, String language) {
        return execute(INTERIOR_SQL, categoryIds, language);
    }

    private List<FacetRow> execute(String sql, Collection<Long> categoryIds, String language) {
        boolean scopeAll = categoryIds == null || categoryIds.isEmpty();
        Collection<Long> safeIds = scopeAll ? List.of(-1L) : categoryIds;
        Query query = entityManager.createNativeQuery(sql, Tuple.class)
                .setParameter("scopeAll", scopeAll)
                .setParameter("categoryIds", safeIds)
                .setParameter("language", language)
                .setHint("jakarta.persistence.query.timeout", 2000);
        return tupleResults(query).stream().map(this::row).toList();
    }

    @SuppressWarnings("unchecked")
    private List<Tuple> tupleResults(Query query) {
        return (List<Tuple>) query.getResultList();
    }

    private FacetRow row(Tuple tuple) {
        return new FacetRow(
                string(tuple, "facet_key"),
                string(tuple, "facet_value"),
                string(tuple, "facet_label"),
                ((Number) tuple.get("option_count")).longValue(),
                decimal(tuple, "min_value"),
                decimal(tuple, "max_value")
        );
    }

    private String string(Tuple tuple, String alias) {
        Object value = tuple.get(alias);
        return value == null ? null : value.toString();
    }

    private BigDecimal decimal(Tuple tuple, String alias) {
        Object value = tuple.get(alias);
        return value == null ? null : new BigDecimal(value.toString());
    }

    public record FacetRow(String key, String value, String label, long count, BigDecimal min, BigDecimal max) {
    }
}
