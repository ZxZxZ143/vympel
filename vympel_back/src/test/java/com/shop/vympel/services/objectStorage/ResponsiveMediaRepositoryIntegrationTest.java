package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.media.MediaKeyCandidate;
import com.shop.vympel.db.repositories.media.MediaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/** Runs the candidate and key-sharing queries against the migrated PostgreSQL schema. */
@SpringBootTest(properties = {"app.storage-deletion.enabled=false", "app.image-variants.enabled=false"})
@Transactional
class ResponsiveMediaRepositoryIntegrationTest {
    private static final String UUID = "0f0e0d0c-0b0a-4908-8706-050403020100";

    @Autowired
    private MediaRepository mediaRepository;
    @Autowired
    private CmsMediaRepository cmsMediaRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void cmsCandidatesExcludeFamiliesAndInactiveRowsAndSharedKeysAreDetected() {
        String legacy = "cms/" + UUID + ".png";
        String family = "cms/responsive-v1/" + UUID + "/" + "c".repeat(64) + "/10x10/original.png";
        long first = insertCms(legacy, "ACTIVE");
        long second = insertCms(legacy, "ACTIVE");
        long converted = insertCms(family, "ACTIVE");
        long pending = insertCms("cms/" + UUID.replace('0', '1') + ".png", "DELETE_PENDING");
        long unique = insertCms("cms/" + UUID.replace('0', '2') + ".png", "ACTIVE");

        var candidates = cmsMediaRepository.findResponsiveCandidates(first - 1, PageRequest.of(0, 25));

        assertThat(candidates).extracting(MediaKeyCandidate::id).contains(first, second, unique)
                .doesNotContain(converted, pending);
        assertThat(candidates).extracting(MediaKeyCandidate::id).isSorted();
        assertThat(cmsMediaRepository.isObjectKeyShared(first, legacy)).isTrue();
        assertThat(cmsMediaRepository.isObjectKeyShared(unique, "cms/" + UUID.replace('0', '2') + ".png")).isFalse();
        // A product media key reused by a CMS row is shared from the product side too.
        assertThat(mediaRepository.isProductMediaKeyShared(-1L, legacy)).isTrue();
        assertThat(mediaRepository.isProductMediaKeyShared(-1L, "product/" + UUID + ".png")).isFalse();
    }

    @Test
    void productCandidateQueryAndOwnerLookupRunOnTheMigratedSchema() {
        var candidates = mediaRepository.findResponsiveCandidates(0L, PageRequest.of(0, 25));

        assertThat(candidates).allSatisfy(candidate ->
                assertThat(candidate.objectKey()).doesNotContain("responsive-v1/"));
        assertThat(mediaRepository.findProductIdByMediaId(-1L)).isEmpty();
    }

    private long insertCms(String key, String lifecycle) {
        return jdbcTemplate.queryForObject("""
                insert into cms_media (storage_type, object_key, content_type, size_bytes, lifecycle_status)
                values ('OBJECT_STORAGE', ?, 'image/png', 1, ?)
                returning id
                """, Long.class, key, lifecycle);
    }
}
