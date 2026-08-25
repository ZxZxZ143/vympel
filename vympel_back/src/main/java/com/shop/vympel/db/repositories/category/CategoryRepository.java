package com.shop.vympel.db.repositories.category;

import com.shop.vympel.db.entity.product.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> getByCode(String categoryCode);

    Optional<Category> findByCode(String code);

    Optional<Category> findByCodeAndActiveTrue(String code);

    Optional<Category> findByIdAndActiveTrue(Long id);

    List<Category> findAllByActiveTrue();

    List<Category> findByParentId(Long parentId);

    List<Category> findByParentIdAndActiveTrue(Long parentId);

    @Query(value = """
            with recursive visible_category as (
                select category.*
                from category
                where category.parent_id is null and category.active = true
                union all
                select child.*
                from category child
                join visible_category parent on parent.id = child.parent_id
                where child.active = true
            )
            select * from visible_category order by id
            """, nativeQuery = true)
    List<Category> findAllPubliclyVisible();

    @Query(value = """
            with recursive visible_category as (
                select category.*
                from category
                where category.parent_id is null and category.active = true
                union all
                select child.*
                from category child
                join visible_category parent on parent.id = child.parent_id
                where child.active = true
            )
            select * from visible_category where id = :id
            """, nativeQuery = true)
    Optional<Category> findPubliclyVisibleById(@Param("id") Long id);

    @Query(value = """
            with recursive visible_category as (
                select category.*
                from category
                where category.parent_id is null and category.active = true
                union all
                select child.*
                from category child
                join visible_category parent on parent.id = child.parent_id
                where child.active = true
            )
            select * from visible_category where code = :code
            """, nativeQuery = true)
    Optional<Category> findPubliclyVisibleByCode(@Param("code") String code);

}
