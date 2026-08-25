package com.shop.vympel.db;

import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.dtos.cms.CmsReorderRequest;
import com.shop.vympel.dtos.crm.CrmManagedUserResponse;
import com.shop.vympel.dtos.crm.CrmUserCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmUserManagementService;
import com.shop.vympel.services.cms.CmsService;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.product.ProductService;
import com.shop.vympel.db.repositories.product.ProductRecommendationRepository;
import com.shop.vympel.services.request.CustomerRequestService;
import com.shop.vympel.services.review.ProductReviewService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;
import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class RefreshSessionMigrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vympel_step3")
            .withUsername("vympel")
            .withPassword("step3-test-password");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CmsMediaRepository cmsMediaRepository;

    @Autowired
    private CmsService cmsService;

    @Autowired
    private ObjectStorageService objectStorageService;

    @Autowired
    private ProductService productService;

    @Autowired
    private CustomerRequestService customerRequestService;

    @Autowired
    private CrmUserManagementService crmUserManagementService;

    @Autowired
    private ProductReviewService productReviewService;

    @Autowired
    private ProductRecommendationRepository productRecommendationRepository;

    @Test
    void liquibaseBuildsRefreshSessionSchemaOnDisposablePostgres() {
        String hashDataType = jdbcTemplate.queryForObject(
                """
                select data_type
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'refresh_token_session'
                  and column_name = 'token_hash'
                """,
                String.class
        );
        Integer hashLength = jdbcTemplate.queryForObject(
                """
                select character_maximum_length
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'refresh_token_session'
                  and column_name = 'token_hash'
                """,
                Integer.class
        );
        Integer constraints = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.table_constraints
                where table_schema = 'public'
                  and table_name = 'refresh_token_session'
                  and constraint_name in (
                    'pk_refresh_token_session',
                    'uk_refresh_token_session_token_hash',
                    'fk_refresh_token_session_user',
                    'fk_refresh_token_session_replacement'
                  )
                """,
                Integer.class
        );
        Integer indexes = jdbcTemplate.queryForObject(
                """
                select count(*)
                from pg_indexes
                where schemaname = 'public'
                  and tablename = 'refresh_token_session'
                  and indexname in (
                    'idx_refresh_token_session_user',
                    'idx_refresh_token_session_family',
                    'idx_refresh_token_session_expires',
                    'idx_refresh_token_session_revoked'
                  )
                """,
                Integer.class
        );
        Integer changeSets = jdbcTemplate.queryForObject(
                """
                select count(*)
                from databasechangelog
                where id in (
                    '2026-07-16-01-crm-refresh-sessions',
                    '2026-07-16-02-crm-refresh-token-hash-type'
                )
                """,
                Integer.class
        );

        assertThat(hashDataType).isEqualTo("character varying");
        assertThat(hashLength).isEqualTo(64);
        assertThat(constraints).isEqualTo(4);
        assertThat(indexes).isEqualTo(4);
        assertThat(changeSets).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("select count(*) from refresh_token_session", Long.class))
                .isZero();
    }

    @Test
    void liquibaseBuildsCmsLifecycleAndDurableRevalidationOutbox() {
        Integer lifecycleColumns = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'cms_media'
                  and column_name in (
                    'lifecycle_status', 'cleanup_protected', 'updated_at', 'orphaned_at',
                    'delete_requested_at', 'last_delete_attempt_at', 'next_delete_attempt_at',
                    'delete_attempt_count', 'last_delete_error_code'
                  )
                """,
                Integer.class
        );
        Integer step5ChangeSets = jdbcTemplate.queryForObject(
                """
                select count(*) from databasechangelog
                where id in (
                    '2026-07-17-01-cms-media-lifecycle',
                    '2026-07-17-02-cms-revalidation-outbox'
                )
                """,
                Integer.class
        );
        Integer revalidationIndexes = jdbcTemplate.queryForObject(
                """
                select count(*) from pg_indexes
                where schemaname = 'public'
                  and tablename = 'cms_revalidation_job'
                  and indexname in ('uk_cms_revalidation_job_page_key', 'idx_cms_revalidation_due')
                """,
                Integer.class
        );

        assertThat(lifecycleColumns).isEqualTo(9);
        assertThat(step5ChangeSets).isEqualTo(2);
        assertThat(revalidationIndexes).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("select count(*) from cms_media", Long.class)).isPositive();
        assertThat(jdbcTemplate.queryForObject("select count(*) from cms_revalidation_job", Long.class)).isZero();
    }

    @Test
    @Transactional
    void authoritativeReferenceQueryCoversEveryDesktopMobileAndLocaleSlot() {
        Long mediaId = jdbcTemplate.queryForObject(
                """
                insert into cms_media (
                    storage_type, object_key, original_filename, content_type, size_bytes,
                    lifecycle_status, cleanup_protected, created_at, updated_at, delete_attempt_count
                ) values (
                    'OBJECT_STORAGE', 'cms/reference-test.png', 'reference-test.png', 'image/png', 4,
                    'ACTIVE', false, now(), now(), 0
                ) returning id
                """,
                Long.class
        );
        Long blockId = jdbcTemplate.queryForObject("select min(id) from cms_block", Long.class);
        jdbcTemplate.update(
                """
                update cms_block
                set media_id = ?, media_kz_id = ?, media_en_id = ?,
                    mobile_media_id = ?, mobile_media_kz_id = ?, mobile_media_en_id = ?
                where id = ?
                """,
                mediaId, mediaId, mediaId, mediaId, mediaId, mediaId, blockId
        );

        var references = cmsMediaRepository.findReferences(mediaId, 20);

        assertThat(cmsMediaRepository.countReferences(mediaId)).isEqualTo(1);
        assertThat(references).extracting(reference -> reference.getSlot())
                .containsExactlyInAnyOrder(
                        "media", "mediaKz", "mediaEn",
                        "mobileMedia", "mobileMediaKz", "mobileMediaEn"
                );
    }

    @Test
    void liquibaseBuildsStep7IntegrityConstraintsAndNormalizesAuditedData() {
        Integer constraints = jdbcTemplate.queryForObject(
                """
                select count(*)
                from pg_constraint
                where conname in (
                    'chk_product_price_nonnegative',
                    'chk_product_stock_nonnegative',
                    'chk_media_position_nonnegative',
                    'uk_media_product_type_position',
                    'chk_media_main_image_position',
                    'chk_cms_block_sort_order_nonnegative',
                    'uk_cms_block_page_sort_order'
                )
                """,
                Integer.class
        );
        Integer mainImageIndexes = jdbcTemplate.queryForObject(
                """
                select count(*) from pg_indexes
                where schemaname = 'public'
                  and tablename = 'media'
                  and indexname = 'ux_media_one_main_image_per_product'
                """,
                Integer.class
        );
        Integer setNullMediaForeignKeys = jdbcTemplate.queryForObject(
                """
                select count(*)
                from pg_constraint c
                join pg_class t on t.oid = c.conrelid
                where t.relname = 'cms_block'
                  and c.contype = 'f'
                  and c.confdeltype = 'n'
                  and c.conname in (
                      'fk_cms_block_media', 'fk_cms_block_media_kz', 'fk_cms_block_media_en',
                      'fk_cms_block_mobile_media', 'fk_cms_block_mobile_media_kz',
                      'fk_cms_block_mobile_media_en'
                  )
                """,
                Integer.class
        );
        Integer changeSets = jdbcTemplate.queryForObject(
                """
                select count(*) from databasechangelog
                where id in (
                    '2026-07-17-03-step7-data-normalization',
                    '2026-07-17-04-step7-database-integrity'
                )
                """,
                Integer.class
        );

        assertThat(constraints).isEqualTo(7);
        assertThat(mainImageIndexes).isEqualTo(1);
        assertThat(setNullMediaForeignKeys).isEqualTo(6);
        assertThat(changeSets).isEqualTo(2);
        assertThat(jdbcTemplate.queryForList(
                """
                select b.sort_order
                from cms_block b
                join cms_page p on p.id = b.page_id
                where p.page_key = 'about'
                  and b.block_key in ('about.heroBanner', 'about.intro', 'about.cooperationBanner')
                order by b.sort_order
                """,
                Integer.class
        )).containsExactly(10, 20, 30);
        assertThat(jdbcTemplate.queryForObject(
                """
                select count(*)
                from product p
                where p.status = 'ACTIVE'
                  and not exists (
                      select 1 from media m
                      where m.product_id = p.id
                        and m.type = 'IMAGE'
                        and m.is_main = true
                        and m.position = 0
                  )
                """,
                Long.class
        )).isZero();
    }

    @Test
    void directInvalidWritesAreRejectedByStep7Constraints() {
        Long brandId = jdbcTemplate.queryForObject("select min(id) from brand", Long.class);
        String suffix = String.valueOf(System.nanoTime());

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                insert into product (sku, price, status, product_type, brand_id, model, stock_quantity)
                values (?, -1, 'DRAFT', 'WATCH', ?, 'negative-price', 0)
                """,
                "STEP7-NEG-PRICE-" + suffix, brandId
        )).isInstanceOf(DataIntegrityViolationException.class);

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                insert into product (sku, price, status, product_type, brand_id, model, stock_quantity)
                values (?, 1, 'DRAFT', 'WATCH', ?, 'negative-stock', -1)
                """,
                "STEP7-NEG-STOCK-" + suffix, brandId
        )).isInstanceOf(DataIntegrityViolationException.class);

        Long productId = insertDraftProduct("STEP7-DIRECT-" + suffix, brandId, 1);
        jdbcTemplate.update(
                "insert into media (url, type, position, is_main, product_id) values (?, 'IMAGE', 0, true, ?)",
                "product/step7-main-" + suffix + ".jpg", productId
        );
        jdbcTemplate.update(
                "insert into media (url, type, position, is_main, product_id) values (?, 'IMAGE', 1, false, ?)",
                "product/step7-side-" + suffix + ".jpg", productId
        );

        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into media (url, type, position, is_main, product_id) values (?, 'IMAGE', 1, false, ?)",
                "product/step7-duplicate-" + suffix + ".jpg", productId
        )).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "update media set is_main = true where product_id = ? and position = 1",
                productId
        )).isInstanceOf(DataIntegrityViolationException.class);
        Long cmsTargetId = jdbcTemplate.queryForObject(
                """
                select b.id
                from cms_block b
                join cms_page p on p.id = b.page_id
                where p.page_key = 'about'
                order by b.sort_order desc
                limit 1
                """,
                Long.class
        );
        Integer duplicateSortOrder = jdbcTemplate.queryForObject(
                """
                select min(b.sort_order)
                from cms_block b
                join cms_page p on p.id = b.page_id
                where p.page_key = 'about'
                """,
                Integer.class
        );
        assertThatThrownBy(() -> jdbcTemplate.update(
                "update cms_block set sort_order = ? where id = ?",
                duplicateSortOrder, cmsTargetId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void concurrentStockDecrementsNeverProduceNegativeInventory() throws Exception {
        Long brandId = jdbcTemplate.queryForObject("select min(id) from brand", Long.class);
        Long productId = insertDraftProduct("STEP7-STOCK-" + System.nanoTime(), brandId, 1);
        List<Integer> updates = runConcurrently(
                () -> jdbcTemplate.update(
                        "update product set stock_quantity = stock_quantity - 1 where id = ? and stock_quantity > 0",
                        productId
                ),
                () -> jdbcTemplate.update(
                        "update product set stock_quantity = stock_quantity - 1 where id = ? and stock_quantity > 0",
                        productId
                )
        );

        assertThat(updates).hasSize(2);
        assertThat(updates.get(0) + updates.get(1)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "select stock_quantity from product where id = ?",
                Integer.class,
                productId
        )).isZero();
    }

    @Test
    void concurrentProductImageReordersRemainCanonical() throws Exception {
        Long brandId = jdbcTemplate.queryForObject("select min(id) from brand", Long.class);
        String suffix = String.valueOf(System.nanoTime());
        Long productId = insertDraftProduct("STEP7-MEDIA-" + suffix, brandId, 1);
        Long firstId = jdbcTemplate.queryForObject(
                """
                insert into media (url, type, position, is_main, product_id)
                values (?, 'IMAGE', 0, true, ?) returning id
                """,
                Long.class,
                "product/step7-first-" + suffix + ".jpg", productId
        );
        Long secondId = jdbcTemplate.queryForObject(
                """
                insert into media (url, type, position, is_main, product_id)
                values (?, 'IMAGE', 1, false, ?) returning id
                """,
                Long.class,
                "product/step7-second-" + suffix + ".jpg", productId
        );

        runConcurrently(
                () -> objectStorageService.reorderProductImages(productId, List.of(secondId, firstId)).size(),
                () -> objectStorageService.reorderProductImages(productId, List.of(firstId, secondId)).size()
        );

        assertThat(jdbcTemplate.queryForObject(
                """
                select count(*) from (
                    select position from media where product_id = ? and type = 'IMAGE'
                    group by position having count(*) > 1
                ) duplicates
                """,
                Long.class,
                productId
        )).isZero();
        assertThat(jdbcTemplate.queryForList(
                "select position from media where product_id = ? and type = 'IMAGE' order by position",
                Integer.class,
                productId
        )).containsExactly(0, 1);
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from media where product_id = ? and type = 'IMAGE' and is_main = true and position = 0",
                Long.class,
                productId
        )).isEqualTo(1);
    }

    @Test
    void concurrentCmsReordersRemainUniqueAndTenStepNormalized() throws Exception {
        Long heroId = jdbcTemplate.queryForObject(
                "select id from cms_block where block_key = 'about.heroBanner'",
                Long.class
        );
        Long cooperationId = jdbcTemplate.queryForObject(
                "select id from cms_block where block_key = 'about.cooperationBanner'",
                Long.class
        );

        runConcurrently(
                () -> cmsService.reorderBlock(heroId, new CmsReorderRequest(30)).sortOrder(),
                () -> cmsService.reorderBlock(cooperationId, new CmsReorderRequest(10)).sortOrder()
        );

        assertThat(jdbcTemplate.queryForObject(
                """
                select count(*) from (
                    select b.sort_order
                    from cms_block b
                    join cms_page p on p.id = b.page_id
                    where p.page_key = 'about'
                    group by b.sort_order
                    having count(*) > 1
                ) duplicates
                """,
                Long.class
        )).isZero();
        assertThat(jdbcTemplate.queryForList(
                """
                select b.sort_order
                from cms_block b
                join cms_page p on p.id = b.page_id
                where p.page_key = 'about'
                order by b.sort_order
                """,
                Integer.class
        )).containsExactly(10, 20, 30);
    }

    @Test
    void concurrentProductFieldUpdatesPreserveBothCommittedChanges() throws Exception {
        Long productId = insertHydratableDraftProduct("CONCURRENT-PRODUCT-" + System.nanoTime(), 4);
        int nextPrice = 18;
        int nextStock = 7;
        try {
            runConcurrently(
                    () -> productService.updatePrice(productId, nextPrice, Language.RU).getPrice(),
                    () -> productService.updateStock(productId, nextStock, Language.RU).getStockQuantity()
            );

            assertThat(jdbcTemplate.queryForObject(
                    "select price::integer from product where id = ?", Integer.class, productId
            )).isEqualTo(nextPrice);
            assertThat(jdbcTemplate.queryForObject(
                    "select stock_quantity from product where id = ?", Integer.class, productId
            )).isEqualTo(nextStock);
        } finally {
            jdbcTemplate.update("delete from product where id = ?", productId);
        }
    }

    @Test
    void concurrentCustomerRequestEditsPreserveStatusAndComment() throws Exception {
        Long requestId = jdbcTemplate.queryForObject(
                """
                insert into customer_request (email, status, created_at, updated_at)
                values (?, 'NEW', now(), now()) returning id
                """,
                Long.class,
                "concurrency-" + System.nanoTime() + "@example.test"
        );
        try {
            runConcurrently(
                    () -> customerRequestService.updateStatus(requestId, "IN_PROGRESS", null).status(),
                    () -> customerRequestService.updateComment(requestId, "serialized comment").adminComment()
            );

            assertThat(jdbcTemplate.queryForObject(
                    "select status from customer_request where id = ?", String.class, requestId
            )).isEqualTo("IN_PROGRESS");
            assertThat(jdbcTemplate.queryForObject(
                    "select admin_comment from customer_request where id = ?", String.class, requestId
            )).isEqualTo("serialized comment");
        } finally {
            jdbcTemplate.update("delete from customer_request where id = ?", requestId);
        }
    }

    @Test
    void concurrentLastAdminDisablesLeaveOneActiveAdministrator() throws Exception {
        long suffix = System.nanoTime();
        CrmManagedUserResponse first = crmUserManagementService.createUser(new CrmUserCreateRequest(
                "concurrent-admin-a-" + suffix + "@example.test", "A-secure-password-1234",
                null, null, null, Set.of("ADMIN"), true
        ));
        CrmManagedUserResponse second = crmUserManagementService.createUser(new CrmUserCreateRequest(
                "concurrent-admin-b-" + suffix + "@example.test", "B-secure-password-1234",
                null, null, null, Set.of("ADMIN"), true
        ));
        List<Long> originalAdmins = jdbcTemplate.queryForList(
                """
                select distinct u.id
                from users u
                join user_role ur on ur.user_id = u.id
                join role r on r.id = ur.role_id
                where u.enabled = true and r.code = 'ADMIN' and u.id not in (?, ?)
                """,
                Long.class,
                first.id(), second.id()
        );
        originalAdmins.forEach(id -> jdbcTemplate.update("update users set enabled = false where id = ?", id));
        try {
            List<Boolean> results = runConcurrently(
                    () -> attemptAdminDisable(first.id()),
                    () -> attemptAdminDisable(second.id())
            );

            assertThat(results).containsExactlyInAnyOrder(true, false);
            assertThat(jdbcTemplate.queryForObject(
                    """
                    select count(*) from users u
                    join user_role ur on ur.user_id = u.id
                    join role r on r.id = ur.role_id
                    where u.enabled = true and r.code = 'ADMIN'
                    """,
                    Long.class
            )).isEqualTo(1L);
        } finally {
            originalAdmins.forEach(id -> jdbcTemplate.update("update users set enabled = true where id = ?", id));
            jdbcTemplate.update("delete from user_role where user_id in (?, ?)", first.id(), second.id());
            jdbcTemplate.update("delete from users where id in (?, ?)", first.id(), second.id());
        }
    }

    @Test
    void concurrentRoleReplacementNeverMergesDisjointRequestedRoleSets() throws Exception {
        long suffix = System.nanoTime();
        CrmManagedUserResponse guardAdmin = crmUserManagementService.createUser(new CrmUserCreateRequest(
                "concurrent-role-guard-" + suffix + "@example.test", "Role-guard-password-1234",
                null, null, null, Set.of("ADMIN"), true
        ));
        CrmManagedUserResponse user = crmUserManagementService.createUser(new CrmUserCreateRequest(
                "concurrent-role-" + suffix + "@example.test", "Role-secure-password-1234",
                null, null, null, Set.of("MANAGER"), true
        ));
        try {
            runConcurrently(
                    () -> crmUserManagementService.updateRoles(user.id(), Set.of("ADMIN")).roles(),
                    () -> crmUserManagementService.updateRoles(user.id(), Set.of("MANAGER")).roles()
            );

            List<String> finalRoles = jdbcTemplate.queryForList(
                    """
                    select r.code from user_role ur
                    join role r on r.id = ur.role_id
                    where ur.user_id = ? order by r.code
                    """,
                    String.class,
                    user.id()
            );
            assertThat(finalRoles).isIn(List.of("ADMIN"), List.of("MANAGER"));
        } finally {
            jdbcTemplate.update("delete from user_role where user_id in (?, ?)", user.id(), guardAdmin.id());
            jdbcTemplate.update("delete from users where id in (?, ?)", user.id(), guardAdmin.id());
        }
    }

    @Test
    void concurrentReviewDeleteAndApproveCannotRepublishDeletedReview() throws Exception {
        Long productId = insertHydratableDraftProduct("CONCURRENT-REVIEW-" + System.nanoTime(), 1);
        Long reviewId = jdbcTemplate.queryForObject(
                """
                insert into product_review (
                    product_id, author_name, author_type, rating, status, created_at, updated_at
                ) values (?, 'Concurrency', 'GUEST', 5, 'PENDING', now(), now()) returning id
                """,
                Long.class,
                productId
        );
        try {
            runConcurrently(
                    () -> attemptReviewModeration(() -> productReviewService.approve(reviewId, Language.RU, null)),
                    () -> attemptReviewModeration(() -> productReviewService.delete(reviewId, Language.RU, null))
            );

            assertThat(jdbcTemplate.queryForObject(
                    "select status from product_review where id = ?", String.class, reviewId
            )).isEqualTo("DELETED");
        } finally {
            jdbcTemplate.update("delete from product where id = ?", productId);
        }
    }

    @Test
    void recommendationsExcludeActiveChildrenBelowAnInactiveAncestor() {
        long suffix = System.nanoTime();
        Long hiddenParentId = jdbcTemplate.queryForObject(
                "insert into category (code, active) values (?, false) returning id",
                Long.class,
                "HIDDEN-PARENT-" + suffix
        );
        Long hiddenChildId = jdbcTemplate.queryForObject(
                "insert into category (code, parent_id, active) values (?, ?, true) returning id",
                Long.class,
                "ACTIVE-CHILD-" + suffix, hiddenParentId
        );
        Long candidateId = insertHydratableDraftProduct("HIDDEN-RECOMMENDATION-" + suffix, 3);
        jdbcTemplate.update("update product set status = 'ACTIVE' where id = ?", candidateId);
        jdbcTemplate.update("delete from product_category where product_id = ?", candidateId);
        jdbcTemplate.update(
                "insert into product_category (product_id, category_id) values (?, ?)",
                candidateId, hiddenChildId
        );
        Long visibleCategoryId = jdbcTemplate.queryForObject(
                "select min(id) from category where parent_id is null and active = true",
                Long.class
        );
        Long brandId = jdbcTemplate.queryForObject("select brand_id from product where id = ?", Long.class, candidateId);
        var source = new ProductRecommendationRepository.SourceProduct(
                -1L, brandId, BigDecimal.ONE, visibleCategoryId, null
        );
        try {
            assertThat(productRecommendationRepository.findRankedCandidateIds(
                    source, "ru", BigDecimal.ZERO, BigDecimal.TEN, 12
            )).extracting(ProductRecommendationRepository.RankedCandidate::productId)
                    .doesNotContain(candidateId);
            assertThat(productRecommendationRepository.findCardsByIds(List.of(candidateId), "ru"))
                    .isEmpty();
        } finally {
            jdbcTemplate.update("delete from product where id = ?", candidateId);
            jdbcTemplate.update("delete from category where id = ?", hiddenChildId);
            jdbcTemplate.update("delete from category where id = ?", hiddenParentId);
        }
    }

    private boolean attemptAdminDisable(Long userId) {
        try {
            crmUserManagementService.updateStatus(userId, false);
            return true;
        } catch (IllegalArgumentException expected) {
            return false;
        }
    }

    private boolean attemptReviewModeration(ConcurrentOperation<?> moderation) throws Exception {
        try {
            moderation.run();
            return true;
        } catch (IllegalArgumentException expected) {
            return false;
        }
    }

    private Long insertDraftProduct(String sku, Long brandId, int stockQuantity) {
        return jdbcTemplate.queryForObject(
                """
                insert into product (sku, price, status, product_type, brand_id, model, stock_quantity)
                values (?, 1, 'DRAFT', 'WATCH', ?, 'step7-test', ?) returning id
                """,
                Long.class,
                sku, brandId, stockQuantity
        );
    }

    private Long insertHydratableDraftProduct(String sku, int stockQuantity) {
        Long brandId = jdbcTemplate.queryForObject("select min(id) from brand", Long.class);
        Long productId = insertDraftProduct(sku, brandId, stockQuantity);
        jdbcTemplate.update(
                "insert into product_i18n (product_id, lang, name) values (?, 'ru', ?)",
                productId, "Concurrent product " + productId
        );
        Long descriptionId = jdbcTemplate.queryForObject(
                "insert into product_description (product_id) values (?) returning id",
                Long.class,
                productId
        );
        jdbcTemplate.update(
                """
                insert into product_description_i18n (description_id, lang, content_md)
                values (?, 'ru', 'Concurrency description')
                """,
                descriptionId
        );
        Long categoryId = jdbcTemplate.queryForObject("select min(id) from category", Long.class);
        jdbcTemplate.update(
                "insert into product_category (product_id, category_id) values (?, ?)",
                productId, categoryId
        );
        return productId;
    }

    private <T> List<T> runConcurrently(ConcurrentOperation<T> first, ConcurrentOperation<T> second) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<T> firstResult = executor.submit(() -> runAfterBarrier(first, ready, start));
            Future<T> secondResult = executor.submit(() -> runAfterBarrier(second, ready, start));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            return List.of(firstResult.get(20, TimeUnit.SECONDS), secondResult.get(20, TimeUnit.SECONDS));
        } finally {
            executor.shutdownNow();
        }
    }

    private <T> T runAfterBarrier(
            ConcurrentOperation<T> operation,
            CountDownLatch ready,
            CountDownLatch start
    ) throws Exception {
        ready.countDown();
        if (!start.await(10, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Concurrent test barrier timed out");
        }
        return operation.run();
    }

    @FunctionalInterface
    private interface ConcurrentOperation<T> {
        T run() throws Exception;
    }
}
