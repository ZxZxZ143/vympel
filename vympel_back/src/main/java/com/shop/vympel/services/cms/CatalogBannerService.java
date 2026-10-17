package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsBlock;
import com.shop.vympel.db.entity.cms.CmsPage;
import com.shop.vympel.dtos.cms.CmsCategoryBannerResponse;
import com.shop.vympel.enums.CmsBlockStatus;
import com.shop.vympel.enums.CmsBlockType;
import com.shop.vympel.enums.CmsPageStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogBannerService {
    private final JdbcTemplate jdbcTemplate;
    public static final String PREFIX = "catalog.category.";
    public static final String SUFFIX = ".heroBanner";

    public void validate(String key, String pageKey, CmsBlockType type) {
        if (key == null || !key.startsWith(PREFIX)) return;
        if (!"catalog".equals(pageKey) || type != CmsBlockType.BANNER || !key.endsWith(SUFFIX) || key.length() <= PREFIX.length() + SUFFIX.length()) {
            throw new IllegalArgumentException("Category banners must be catalog BANNER blocks");
        }
        String code = key.substring(PREFIX.length(), key.length() - SUFFIX.length());
        Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM category WHERE code = ?", Long.class, code);
        if (count == null || count != 1) throw new IllegalArgumentException("Unknown banner category");
    }

    public List<CmsCategoryBannerResponse> resolve(CmsPage page, boolean crm) {
        if (!"catalog".equals(page.getPageKey())) return List.of();
        List<CategoryNode> categories = jdbcTemplate.query("""
                SELECT c.id, c.code, c.parent_id, c.active, ru.name AS ru, kk.name AS kz, en.name AS en
                FROM category c
                LEFT JOIN category_i18n ru ON ru.category_id = c.id AND ru.lang = 'ru'
                LEFT JOIN category_i18n kk ON kk.category_id = c.id AND kk.lang = 'kk'
                LEFT JOIN category_i18n en ON en.category_id = c.id AND en.lang = 'en'
                ORDER BY c.id
                """, (rs, row) -> new CategoryNode(rs.getLong("id"), rs.getString("code"),
                rs.getObject("parent_id", Long.class), rs.getBoolean("active"),
                Map.of("ru", name(rs.getString("ru"), rs.getString("code")),
                       "kz", name(rs.getString("kz"), name(rs.getString("ru"), rs.getString("code"))),
                       "en", name(rs.getString("en"), name(rs.getString("ru"), rs.getString("code"))))));
        Set<String> explicit = new HashSet<>();
        Set<String> published = new HashSet<>();
        for (CmsBlock block : page.getBlocks()) {
            if (block.getBlockType() != CmsBlockType.BANNER) continue;
            if (crm) explicit.add(block.getBlockKey());
            boolean hasImage = block.getMedia() != null || block.getMediaKz() != null || block.getMediaEn() != null
                    || block.getMobileMedia() != null || block.getMobileMediaKz() != null || block.getMobileMediaEn() != null;
            if (page.getStatus() == CmsPageStatus.ACTIVE && block.getStatus() == CmsBlockStatus.PUBLISHED && hasImage) {
                published.add(block.getBlockKey());
                explicit.add(block.getBlockKey());
            }
        }
        return resolve(categories, explicit, published, crm);
    }

    static List<CmsCategoryBannerResponse> resolve(List<CategoryNode> categories, Set<String> explicit,
                                                  Set<String> published, boolean crm) {
        Map<Long, CategoryNode> byId = categories.stream().collect(Collectors.toMap(CategoryNode::id, Function.identity()));
        List<CmsCategoryBannerResponse> result = new ArrayList<>();
        for (CategoryNode category : categories) {
            List<CategoryNode> path = new ArrayList<>();
            Set<Long> visited = new HashSet<>();
            CategoryNode current = category;
            boolean visible = true;
            while (current != null && visited.add(current.id())) {
                path.add(current);
                visible &= current.active();
                if (current.parentId() == null) break;
                current = byId.get(current.parentId());
            }
            boolean rooted = !path.isEmpty() && path.get(path.size() - 1).parentId() == null;
            if (!crm && (!visible || !rooted)) continue;
            CategoryNode source = path.stream().filter(node -> published.contains(key(node.code()))).findFirst().orElse(null);
            String effective = source == null ? (published.contains("catalog.heroBanner") ? "catalog.heroBanner" : null) : key(source.code());
            CategoryNode parent = byId.get(category.parentId());
            result.add(new CmsCategoryBannerResponse(category.code(), parent == null ? null : parent.code(), category.names(),
                    explicit.contains(key(category.code())) ? key(category.code()) : null, effective,
                    source == null ? null : source.code(),
                    source == null ? "DEFAULT" : source.id().equals(category.id()) ? "OWN" : "INHERITED",
                    categories.stream().anyMatch(node -> category.id().equals(node.parentId()))));
        }
        return List.copyOf(result);
    }

    private static String key(String code) { return PREFIX + code + SUFFIX; }
    private static String name(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    record CategoryNode(Long id, String code, Long parentId, boolean active, Map<String, String> names) {}
}
