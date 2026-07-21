package com.shop.vympel.services.cms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CmsMediaDryRunIntegrationTest {
    @Autowired
    private CmsMediaCleanupService cleanupService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void dryRunClassifiesCandidatesWithoutDeletingRows() {
        Long before = jdbcTemplate.queryForObject("select count(*) from cms_media", Long.class);

        var result = cleanupService.dryRun(0, 100);

        Long after = jdbcTemplate.queryForObject("select count(*) from cms_media", Long.class);
        assertThat(after).isEqualTo(before);
        assertThat(result.items()).allSatisfy(candidate -> assertThat(candidate.referenceCount()).isZero());
        System.out.printf(
                "CMS_MEDIA_DRY_RUN totalRows=%d candidates=%d pageItems=%d%n",
                before,
                result.totalItems(),
                result.items().size()
        );
    }
}
