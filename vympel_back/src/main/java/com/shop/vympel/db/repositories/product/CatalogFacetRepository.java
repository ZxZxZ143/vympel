package com.shop.vympel.db.repositories.product;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.Locale;

@Repository
public class CatalogFacetRepository {
    // Keep the category's options stable; only their counts depend on the selection.
    // Each facet ignores its own selection, so multi-select alternatives remain available.
    private static final String SCOPE = """
            with scoped as (
                select p.id, p.price, p.brand_id, f.facet_key, (/*MATCHES*/) as matches
                from product p cross join (values /*FACET_KEYS*/) f(facet_key)
                where p.status = 'ACTIVE' and exists (
                    select 1 from product_category pc join category c on c.id = pc.category_id
                    where pc.product_id = p.id and c.active = true and pc.category_id in (:categoryIds)
                )
            )
            """;
    private static final Map<String, String> WATCH_COLUMNS = Map.of(
            "mechanism", "mechanism_id", "gender", "gender_id", "caseMaterial", "case_material_id",
            "strapMaterial", "strap_material_id", "glassType", "glass_type_id",
            "stoneInlay", "stone_inlay_id", "caseSize", "case_size_mm");
    private static final Map<String, String> INTERIOR_COLUMNS = Map.of(
            "interiorCaseMaterial", "case_material_id", "interiorColor", "color_id",
            "interiorStyle", "style_id", "interiorMechanismType", "mechanism_type_id", "powerType", "power_type_id");

    private static final String BASE_SQL = SCOPE + """
            select 'price' as facet_key, null::text as facet_value, null::text as facet_label,
                   count(*) filter (where matches)::bigint as option_count,
                   min(price) filter (where matches) as min_value, max(price) filter (where matches) as max_value
            from scoped where facet_key = 'price'
            union all
            select 'brand', b.id::text, coalesce(nullif(trim(b.name), ''), b.code),
                   count(s.id) filter (where s.matches)::bigint, null::numeric, null::numeric
            from brand b left join scoped s on s.brand_id = b.id and s.facet_key = 'brand'
            where b.active = true
            group by b.id, b.name, b.code
            union all
            select 'country', c.id::text,
                   coalesce(nullif(trim(local_name.name), ''), nullif(trim(ru_name.name), ''), c.code),
                   count(s.id) filter (where s.matches)::bigint, null::numeric, null::numeric
            from country c
            left join country_i18n local_name on local_name.country_id = c.id and local_name.lang = :language
            left join country_i18n ru_name on ru_name.country_id = c.id and ru_name.lang = 'ru'
left join brand_country bc on bc.country_id = c.id
left join scoped s on s.brand_id = bc.brand_id and s.facet_key = 'country'
            where c.active = true
            group by c.id, c.code, local_name.name, ru_name.name
            """;

    private static final String WRIST_SQL = SCOPE + """
            , details as (
                select wd.*, s.facet_key, s.matches from watch_details wd join scoped s on s.id = wd.product_id
            )
            select 'mechanism' as facet_key, r.id::text as facet_value,
                   coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code) as facet_label,
                   count(d.product_id) filter (where d.matches)::bigint as option_count, null::numeric as min_value, null::numeric as max_value
            from watch_mechanism r left join details d on d.mechanism_id = r.id and d.facet_key = 'mechanism'
            left join watch_mechanism_i18n l on l.mechanism_id = r.id and l.lang = :language
            left join watch_mechanism_i18n ru on ru.mechanism_id = r.id and ru.lang = 'ru'
            where r.active = true or d.product_id is not null
            group by r.id, r.code, l.name, ru.name
            union all
            select 'gender', r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(d.product_id) filter (where d.matches)::bigint, null::numeric, null::numeric
            from gender r left join details d on d.gender_id = r.id and d.facet_key = 'gender'
            left join gender_i18n l on l.gender_id = r.id and l.lang = :language
            left join gender_i18n ru on ru.gender_id = r.id and ru.lang = 'ru'
            where r.active = true or d.product_id is not null
            group by r.id, r.code, l.name, ru.name
            union all
            select f.facet_key, r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(x.product_id) filter (where x.matches)::bigint, null::numeric, null::numeric
            from (values ('caseMaterial', 'CASE'), ('strapMaterial', 'STRAP')) f(facet_key, material_group)
            cross join material r
            left join (
                select product_id, matches, case_material_id as material_id, facet_key from details where facet_key = 'caseMaterial'
                union all select product_id, matches, strap_material_id, facet_key from details where facet_key = 'strapMaterial'
            ) x on r.id = x.material_id and x.facet_key = f.facet_key
            left join material_i18n l on l.material_id = r.id and l.lang = :language
            left join material_i18n ru on ru.material_id = r.id and ru.lang = 'ru'
            where (r.active = true and r.material_group = f.material_group) or x.product_id is not null
            group by f.facet_key, r.id, r.code, l.name, ru.name
            union all
            select 'glassType', r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(d.product_id) filter (where d.matches)::bigint, null::numeric, null::numeric
            from glass_type r left join details d on d.glass_type_id = r.id and d.facet_key = 'glassType'
            left join glass_type_i18n l on l.glass_type_id = r.id and l.lang = :language
            left join glass_type_i18n ru on ru.glass_type_id = r.id and ru.lang = 'ru'
            where r.active = true or d.product_id is not null
            group by r.id, r.code, l.name, ru.name
            union all
            select 'stoneInlay', r.id::text, coalesce(nullif(trim(l.name), ''), nullif(trim(ru.name), ''), r.code),
                   count(d.product_id) filter (where d.matches)::bigint, null::numeric, null::numeric
            from stone_inlay r left join details d on d.stone_inlay_id = r.id and d.facet_key = 'stoneInlay'
            left join stone_inlay_i18n l on l.stone_inlay_id = r.id and l.lang = :language
            left join stone_inlay_i18n ru on ru.stone_inlay_id = r.id and ru.lang = 'ru'
            where r.active = true or d.product_id is not null
            group by r.id, r.code, l.name, ru.name
            union all
            select 'caseSize', trim(trailing '.' from trim(trailing '0' from d.case_size_mm::text)),
                   trim(trailing '.' from trim(trailing '0' from d.case_size_mm::text)),
                   count(d.product_id) filter (where d.matches)::bigint, null::numeric, null::numeric
            from details d where d.case_size_mm is not null and d.facet_key = 'caseSize'
            group by d.case_size_mm
            """;

    private static final String INTERIOR_SQL = SCOPE + """
            , details as (
                select icd.*, s.facet_key, s.matches from interior_clock_details icd join scoped s on s.id = icd.product_id
            ), refs as (
                select product_id, matches, case_material_id as ref_id, facet_key, 'material'::text as ref_type from details where facet_key = 'interiorCaseMaterial'
                union all select product_id, matches, color_id, facet_key, 'feature' from details where facet_key = 'interiorColor'
                union all select product_id, matches, style_id, facet_key, 'feature' from details where facet_key = 'interiorStyle'
                union all select product_id, matches, mechanism_type_id, facet_key, 'feature' from details where facet_key = 'interiorMechanismType'
                union all select product_id, matches, power_type_id, facet_key, 'feature' from details where facet_key = 'powerType'
            ), options as (
                select 'interiorCaseMaterial'::text as facet_key, id as ref_id, 'material'::text as ref_type
                from material where active = true and material_group = 'CASE'
                union
                select t.facet_key, f.id, 'feature' from interior_feature f
                join (values ('interiorColor', 'COLOR'), ('interiorStyle', 'STYLE'),
                             ('interiorMechanismType', 'MECHANISM'), ('powerType', 'POWER')) t(facet_key, feature_type)
                  on t.feature_type = f.feature_type
                where f.active = true
                union
                select facet_key, ref_id, ref_type from refs where ref_id is not null
            )
            select options.facet_key, options.ref_id::text as facet_value,
                   coalesce(nullif(trim(mi.name), ''), nullif(trim(mru.name), ''),
                            nullif(trim(fi.name), ''), nullif(trim(fru.name), ''),
                            m.code, f.code) as facet_label,
                   count(refs.product_id) filter (where refs.matches)::bigint as option_count, null::numeric as min_value, null::numeric as max_value
            from options
            left join refs on refs.facet_key = options.facet_key and refs.ref_id = options.ref_id and refs.ref_type = options.ref_type
            left join material m on options.ref_type = 'material' and m.id = options.ref_id
            left join material_i18n mi on mi.material_id = m.id and mi.lang = :language
            left join material_i18n mru on mru.material_id = m.id and mru.lang = 'ru'
            left join interior_feature f on options.ref_type = 'feature' and f.id = options.ref_id
            left join interior_feature_i18n fi on fi.feature_id = f.id and fi.lang = :language
            left join interior_feature_i18n fru on fru.feature_id = f.id and fru.lang = 'ru'
            group by options.facet_key, options.ref_id, mi.name, mru.name, fi.name, fru.name, m.code, f.code
            """;

    @PersistenceContext
    private EntityManager entityManager;

    public List<FacetRow> findBaseFacets(Collection<Long> categoryIds, String language, Selection selection) {
        return execute(BASE_SQL, List.of("price", "brand", "country"), categoryIds, language, selection);
    }

    public List<FacetRow> findWristFacets(Collection<Long> categoryIds, String language, Selection selection) {
        return execute(WRIST_SQL, List.copyOf(WATCH_COLUMNS.keySet()), categoryIds, language, selection);
    }

    public List<FacetRow> findInteriorFacets(Collection<Long> categoryIds, String language, Selection selection) {
        return execute(INTERIOR_SQL, List.copyOf(INTERIOR_COLUMNS.keySet()), categoryIds, language, selection);
    }

    private List<FacetRow> execute(String sql, List<String> keys, Collection<Long> categoryIds,
                                  String language, Selection selection) {
        Map<String, Object> parameters = new LinkedHashMap<>();
        List<String> predicates = new ArrayList<>();
        if (selection.priceMin() != null) {
            predicates.add("(f.facet_key = 'price' or p.price >= :priceMin)");
            parameters.put("priceMin", selection.priceMin());
        }
        if (selection.priceMax() != null) {
            predicates.add("(f.facet_key = 'price' or p.price <= :priceMax)");
            parameters.put("priceMax", selection.priceMax());
        }
        // Same matching fields and trigram threshold as the product-list specification.
        if (selection.search() != null) {
            predicates.add("""
                (lower(p.model) like :searchLike or lower(p.sku) like :searchLike
                 or similarity(lower(p.model), :search) > 0.25 or similarity(lower(p.sku), :search) > 0.25
                 or exists (select 1 from brand b where b.id = p.brand_id and
                    (lower(b.name) like :searchLike or similarity(lower(b.name), :search) > 0.25))
                 or exists (select 1 from product_i18n n where n.product_id = p.id and
                    (lower(n.name) like :searchLike or similarity(lower(n.name), :search) > 0.25))
                 or exists (select 1 from collection c where c.id = p.collection_id and
                    (lower(c.name) like :searchLike or lower(c.code) like :searchLike
                     or similarity(lower(c.name), :search) > 0.25 or similarity(lower(c.code), :search) > 0.25)))
                """);
            String search = selection.search().toLowerCase(Locale.ROOT);
            parameters.put("search", search);
            parameters.put("searchLike", "%" + search + "%");
        }
        selection.filters().forEach((key, values) -> {
            if (values.isEmpty()) return;
            String parameter = "selected_" + key;
            String predicate;
            if ("brand".equals(key)) predicate = "p.brand_id in (:" + parameter + ")";
            else if ("country".equals(key)) predicate = "exists (select 1 from brand_country bc where bc.brand_id = p.brand_id and bc.country_id in (:" + parameter + "))";
            else {
                String table = WATCH_COLUMNS.containsKey(key) ? "watch_details" : "interior_clock_details";
                String column = WATCH_COLUMNS.containsKey(key) ? WATCH_COLUMNS.get(key) : INTERIOR_COLUMNS.get(key);
                if (column == null) return;
                predicate = "exists (select 1 from " + table + " d where d.product_id = p.id and d." + column + " in (:" + parameter + "))";
            }
            // Keys/columns are allow-listed above; all user values remain bound parameters.
            predicates.add("(f.facet_key = '" + key + "' or " + predicate + ")");
            parameters.put(parameter, values);
        });
        String facetKeys = keys.stream().map(key -> "('" + key + "')").collect(java.util.stream.Collectors.joining(","));
        Query query = entityManager.createNativeQuery(sql.replace("/*FACET_KEYS*/", facetKeys)
                        .replace("/*MATCHES*/", predicates.isEmpty() ? "true" : String.join(" and ", predicates)), Tuple.class)
                .setParameter("categoryIds", categoryIds == null || categoryIds.isEmpty() ? List.of(-1L) : categoryIds)
                .setParameter("language", language)
                .setHint("jakarta.persistence.query.timeout", 2000);
        parameters.forEach(query::setParameter);
        return tupleResults(query).stream().map(this::row).toList();
    }

    public record Selection(String search, BigDecimal priceMin, BigDecimal priceMax,
                            Map<String, List<? extends Number>> filters) {
        public static final Selection EMPTY = new Selection(null, null, null, Map.of());
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
