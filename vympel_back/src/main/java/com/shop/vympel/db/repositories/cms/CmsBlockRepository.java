package com.shop.vympel.db.repositories.cms;

import com.shop.vympel.db.entity.cms.CmsBlock;
import com.shop.vympel.enums.CmsBlockStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CmsBlockRepository extends JpaRepository<CmsBlock, Long> {
    List<CmsBlock> findByPage_PageKeyOrderBySortOrderAscIdAsc(String pageKey);

    List<CmsBlock> findByPage_PageKeyAndStatusOrderBySortOrderAscIdAsc(String pageKey, CmsBlockStatus status);

    boolean existsByBlockKey(String blockKey);

    boolean existsByBlockKeyAndIdNot(String blockKey, Long id);

    @Query("select block.page.id from CmsBlock block where block.id = :blockId")
    Optional<Long> findPageIdByBlockId(@Param("blockId") Long blockId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select block
            from CmsBlock block
            where block.page.id = :pageId
            order by block.sortOrder asc, block.id asc
            """)
    List<CmsBlock> findAllByPageIdForUpdate(@Param("pageId") Long pageId);
}
