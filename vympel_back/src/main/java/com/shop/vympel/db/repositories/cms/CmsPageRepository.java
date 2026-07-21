package com.shop.vympel.db.repositories.cms;

import com.shop.vympel.db.entity.cms.CmsPage;
import com.shop.vympel.enums.CmsPageStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CmsPageRepository extends JpaRepository<CmsPage, Long> {
    List<CmsPage> findAllByOrderByPageKeyAsc();

    Optional<CmsPage> findByPageKey(String pageKey);

    Optional<CmsPage> findByPageKeyAndStatus(String pageKey, CmsPageStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select page from CmsPage page where page.id = :pageId")
    Optional<CmsPage> findByIdForUpdate(@Param("pageId") Long pageId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select page from CmsPage page where page.pageKey = :pageKey")
    Optional<CmsPage> findByPageKeyForUpdate(@Param("pageKey") String pageKey);
}
