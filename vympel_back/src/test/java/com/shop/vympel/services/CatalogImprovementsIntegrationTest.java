package com.shop.vympel.services;

import com.shop.vympel.controllers.*;
import com.shop.vympel.dtos.crm.*;
import com.shop.vympel.dtos.cms.*;
import com.shop.vympel.enums.*;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.services.product.*;
import com.shop.vympel.services.crm.*;
import com.shop.vympel.services.cms.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties = {"app.storage-deletion.enabled=false", "app.cms.public-revalidate.enabled=true"})
@Transactional
class CatalogImprovementsIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;
    @Autowired ProductService products;
    @Autowired ProductBatchSummaryService summaries;
    @Autowired CrmProductController productController;
    @Autowired CrmCollectionController collectionController;
    @Autowired CrmReferenceController referenceController;
    @Autowired CrmReferenceMutationService references;
    @Autowired CmsService cms;

    private Long product(String status) {
        String suffix = UUID.randomUUID().toString();
        Long id = jdbc.queryForObject("""
          INSERT INTO product (model,sku,price,stock_quantity,status,product_type,brand_id)
          VALUES (?, ?, 1001, 3, ?, 'WATCH', (SELECT id FROM brand WHERE code = 'romanson')) RETURNING id
          """, Long.class, "FEATURE-"+suffix, "FEATURE-"+suffix, status);
        jdbc.update("INSERT INTO product_i18n(product_id,lang,name) VALUES (?,'ru','Feature test')",id);
        Long desc = jdbc.queryForObject("INSERT INTO product_description(product_id) VALUES (?) RETURNING id",Long.class,id);
        jdbc.update("INSERT INTO product_description_i18n(description_id,lang,content_md) VALUES (?,'ru','')",desc);
        jdbc.update("INSERT INTO product_category(product_id,category_id) SELECT ?,id FROM category WHERE code='WATCH_WRIST'",id);
        return id;
    }
    private void flush() { em.flush(); em.clear(); }
    private long count(String table, String column, Object value) {
        return jdbc.queryForObject("SELECT count(*) FROM "+table+" WHERE "+column+" = ?",Long.class,value);
    }
    private Long collection() {
        return jdbc.queryForObject("INSERT INTO collection(brand_id,code,name) SELECT id,?,'Feature collection' FROM brand WHERE code='romanson' RETURNING id",Long.class,"FEATURE_"+UUID.randomUUID());
    }
    @Test void discountPersistsClearsAndReachesPublicDetailAndBatchWithAudit() {
        Long id=product("ACTIVE");
        var updated=productController.updateDiscount(id,new QuickDiscountUpdateRequest(new BigDecimal("50")),"ru",new MockHttpServletRequest());
        assertThat(updated.getPrice()).isEqualTo(1001);
        assertThat(updated.getFinalPrice()).isEqualTo(501);
        flush();
        assertThat(jdbc.queryForObject("SELECT discount_percent FROM product WHERE id=?",Integer.class,id)).isEqualTo(50);
        assertThat(products.getPublic(id,Language.RU).finalPrice()).isEqualTo(501);
        assertThat(summaries.getSummaries(List.of(id),Language.RU).items().get(0).finalPrice()).isEqualTo(501);
        assertThat(count("crm_activity","event_type","PRODUCT_DISCOUNT_CHANGED")).isGreaterThan(0);
        productController.updateDiscount(id,new QuickDiscountUpdateRequest(null),"ru",new MockHttpServletRequest());
        flush();
        assertThat(summaries.getSummaries(List.of(id),Language.RU).items().get(0).finalPrice()).isEqualTo(1001);
        assertThat(jdbc.queryForObject("SELECT discount_percent FROM product WHERE id=?",Integer.class,id)).isNull();
    }
    @Test void archivedDeletionCascadesOwnedRowsQueuesMediaAndAudits() {
        Long id=product("ARCHIVED");
        String key="products/feature-test-"+UUID.randomUUID()+".png";
        jdbc.update("INSERT INTO media(url,type,product_id,is_main) VALUES (?,'IMAGE',?,true)",key,id);
        productController.deleteArchivedProduct(id,new MockHttpServletRequest());
        flush();
        for(String table:List.of("product_i18n","product_category","product_description","media")) assertThat(count(table,"product_id",id)).isZero();
        assertThat(count("product","id",id)).isZero();
        assertThat(count("object_storage_deletion_job","object_key",key)).isEqualTo(1);
        assertThat(count("crm_activity","event_type","PRODUCT_DELETED")).isGreaterThan(0);
    }
    @ParameterizedTest @ValueSource(strings={"ACTIVE","DRAFT"})
    void rejectsPermanentDeletionUnlessArchived(String status) {
        Long id=product(status);
        assertThatThrownBy(()->products.delete(id)).isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("archived");
        assertThat(count("product","id",id)).isEqualTo(1);
    }
    @Test void refusesSharedMediaDeletion() {
        Long id=product("ARCHIVED");
        String key="products/shared-"+UUID.randomUUID()+".png";
        jdbc.update("INSERT INTO media(url,type,product_id,is_main) VALUES (?,'IMAGE',?,true)",key,id);
        jdbc.update("INSERT INTO cms_media(storage_type,object_key) VALUES ('OBJECT_STORAGE',?)",key);
        assertThatThrownBy(()->products.delete(id)).isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("referenced");
        assertThat(count("object_storage_deletion_job","object_key",key)).isZero();
    }
    @Test void rejectsUsedCollectionWithoutNullingProductLink() {
        Long col=collection();Long id=product("DRAFT");jdbc.update("UPDATE product SET collection_id=? WHERE id=?",col,id);
        assertThatThrownBy(()->collectionController.deleteCollection(col,new MockHttpServletRequest())).isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("1 products");
        assertThat(count("product","collection_id",col)).isEqualTo(1);
    }
    @Test void deletesUnusedCollectionTranslationsAndAudits() {
        Long col=collection();jdbc.update("INSERT INTO collection_i18n(collection_id,lang,name) VALUES (?,'ru','Test')",col);
        collectionController.deleteCollection(col,new MockHttpServletRequest());flush();
        assertThat(count("collection","id",col)).isZero();assertThat(count("collection_i18n","collection_id",col)).isZero();
        assertThat(count("crm_activity","event_type","COLLECTION_DELETED")).isGreaterThan(0);
    }
    @ParameterizedTest @ValueSource(strings={"watch-mechanisms","genders","case-materials","strap-materials","glass-types","stone-inlays","colors","interior-styles","interior-mechanisms","interior-power-types","watch-dial-types","watch-dial-markings","watch-power-sources","watch-water-resistances","watch-features"})
    void deletesUnusedCustomReferenceAndAudits(String type) {
        var created=references.create(type,new CrmReferenceCreateRequest("Feature "+UUID.randomUUID(),null,null),Language.RU);
        assertThat(created.deletable()).isTrue();
        referenceController.deleteReference(type,created.id(),new MockHttpServletRequest());flush();
        assertThat(count("crm_activity","event_type","REFERENCE_VALUE_DELETED")).isGreaterThan(0);
    }
    @Test void refusesUsedWatchFeatureInsteadOfCascadingItsProductLinks() {
        var created=references.create("watch-features",new CrmReferenceCreateRequest("Feature "+UUID.randomUUID(),null,null),Language.RU);
        Long id=product("DRAFT");jdbc.update("INSERT INTO watch_details_feature(product_id,feature_id) VALUES (?,?)",id,created.id());
        assertThatThrownBy(()->references.delete("watch-features",created.id())).isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("used");
        assertThat(count("watch_details_feature","product_id",id)).isEqualTo(1);
    }
    @ParameterizedTest
    @CsvSource({
        "watch-mechanisms,watch_details,mechanism_id", "genders,watch_details,gender_id",
        "case-materials,watch_details,case_material_id", "strap-materials,watch_details,strap_material_id",
        "case-materials,interior_clock_details,case_material_id", "case-materials,accessory_details,case_material_id",
        "strap-materials,accessory_details,insert_material_id", "glass-types,watch_details,glass_type_id",
        "stone-inlays,watch_details,stone_inlay_id", "colors,watch_details,strap_color_id",
        "colors,watch_details,dial_color_id", "colors,accessory_details,color_id",
        "colors,interior_clock_details,color_id", "interior-styles,interior_clock_details,style_id",
        "interior-mechanisms,interior_clock_details,mechanism_type_id", "interior-power-types,interior_clock_details,power_type_id",
        "watch-dial-types,watch_details,dial_type_id", "watch-dial-markings,watch_details,dial_marking_id",
        "watch-power-sources,watch_details,power_source_id", "watch-water-resistances,watch_details,water_resistance_option_id"
    })
    void refusesEverySupportedReferenceDependency(String type, String table, String column) {
        var created=references.create(type,new CrmReferenceCreateRequest("Usage "+UUID.randomUUID(),null,null),Language.RU);
        Long id=product("DRAFT");
        jdbc.update("INSERT INTO "+table+"(product_id,"+column+") VALUES (?,?)", id,created.id());
        assertThatThrownBy(()->references.delete(type,created.id())).isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("used");
        assertThat(count(table,column,created.id())).isEqualTo(1);
    }
    @ParameterizedTest @ValueSource(ints={0,-1,100})
    void databaseRejectsInvalidDiscounts(int discount) {
        Long id=product("DRAFT");
        assertThatThrownBy(()->jdbc.update("UPDATE product SET discount_percent=? WHERE id=?",discount,id))
            .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }
    @Test void refusesSeededAndUnknownReferenceTypes() {
        Long id=jdbc.queryForObject("SELECT min(id) FROM watch_mechanism WHERE code NOT LIKE 'CRM_%'",Long.class);
        assertThatThrownBy(()->references.delete("watch-mechanisms",id)).isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("System");
        assertThatThrownBy(()->references.delete("brands",id)).isInstanceOf(IllegalArgumentException.class);
    }
    private CmsBlockRequest banner(String code, Long media) {
        return new CmsBlockRequest("catalog","catalog.category."+code+".heroBanner",CmsBlockType.BANNER,9999,CmsBlockStatus.PUBLISHED,null,media,null,null,null,null,null,CmsLinkType.NONE,null,CmsLinkOpenBehavior.SAME_TAB,Map.of());
    }
    private String effective(String code) {
        return cms.getPublicPage("catalog",Language.RU).categoryBanners().stream().filter(row->row.categoryCode().equals(code)).findFirst().orElseThrow().effectiveBlockKey();
    }
    @Test void categoryMutationUpdatesInheritedBannerPreservesOverridesAndQueuesCatalogRefresh() {
        String suffix=UUID.randomUUID().toString().replace("-","").substring(0,8).toUpperCase();
        String root="FEATURE_ROOT_"+suffix, child="FEATURE_CHILD_"+suffix, other="FEATURE_OTHER_"+suffix;
        Long rootId=jdbc.queryForObject("INSERT INTO category(code,active) VALUES (?,true) RETURNING id",Long.class,root);
        jdbc.update("INSERT INTO category(code,parent_id,active) VALUES (?,?,true),(?,?,true)",child,rootId,other,rootId);
        Long a=jdbc.queryForObject("INSERT INTO cms_media(storage_type,public_url) VALUES ('PUBLIC_PATH','/test-a.png') RETURNING id",Long.class);
        Long b=jdbc.queryForObject("INSERT INTO cms_media(storage_type,public_url) VALUES ('PUBLIC_PATH','/test-b.png') RETURNING id",Long.class);
        var parent=cms.createBlock(banner(root,a));flush();
        var override=cms.createBlock(banner(other,b));flush();
        assertThat(effective(child)).isEqualTo(parent.blockKey());
        assertThat(effective(other)).isEqualTo(override.blockKey());
        cms.updateBlock(parent.id(),banner(root,b));flush();
        assertThat(effective(child)).isEqualTo(parent.blockKey());
        assertThat(cms.getPublicPage("catalog",Language.RU).blocks().stream().filter(row->row.blockKey().equals(effective(child))).findFirst().orElseThrow().media().id()).isEqualTo(b);
        assertThat(effective(other)).isEqualTo(override.blockKey());
        cms.deleteBlock(override.id());flush();
        assertThat(effective(other)).isEqualTo(parent.blockKey());
        assertThat(count("cms_block","block_key","catalog.category."+child+".heroBanner")).isZero();
        assertThat(count("cms_revalidation_job","page_key","catalog")).isGreaterThan(0);
    }
}
