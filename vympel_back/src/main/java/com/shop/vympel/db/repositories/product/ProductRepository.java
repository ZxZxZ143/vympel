package com.shop.vympel.db.repositories.product;

import com.shop.vympel.db.entity.product.Product;
import jakarta.persistence.LockModeType;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findProductBySku(String sku);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select product from Product product where product.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @NonNull
    Page<Product> findAll(@NonNull Pageable pageable);

    long countByStatus(String status);

    long countByStockQuantityGreaterThan(Integer stockQuantity);

    long countByStockQuantityLessThanEqual(Integer stockQuantity);

    @Query("select count(p) from Product p where p.kaspiUrl is null or p.kaspiUrl = ''")
    long countMissingKaspiUrl();

    @Query("select count(p) from Product p where p.wildberriesUrl is null or p.wildberriesUrl = ''")
    long countMissingWildberriesUrl();

    List<Product> findTop5ByOrderByUpdatedAtDesc();

    Page<Product> findAllByStatusIgnoreCase(String status, Pageable pageable);

    @Query("""
            select distinct p
            from Product p
            left join ProductI18n pi on pi.product = p
            left join p.brand brand
            left join ProductCategory pc on pc.product = p
            left join CategoryI18n ci on ci.category = pc.category
            where cast(p.id as string) like concat('%', :search, '%')
               or lower(p.model) like lower(concat('%', :search, '%'))
               or lower(p.sku) like lower(concat('%', :search, '%'))
               or lower(p.status) like lower(concat('%', :search, '%'))
               or lower(brand.name) like lower(concat('%', :search, '%'))
               or lower(pi.name) like lower(concat('%', :search, '%'))
               or lower(pc.category.code) like lower(concat('%', :search, '%'))
               or lower(ci.name) like lower(concat('%', :search, '%'))
            """)
    Page<Product> searchForCrm(@Param("search") String search, Pageable pageable);

    @Query("""
            select distinct p
            from Product p
            left join ProductI18n pi on pi.product = p
            left join p.brand brand
            left join ProductCategory pc on pc.product = p
            left join CategoryI18n ci on ci.category = pc.category
            where lower(p.status) = lower(:status)
              and (
                   cast(p.id as string) like concat('%', :search, '%')
                or lower(p.model) like lower(concat('%', :search, '%'))
                or lower(p.sku) like lower(concat('%', :search, '%'))
                or lower(p.status) like lower(concat('%', :search, '%'))
                or lower(brand.name) like lower(concat('%', :search, '%'))
                or lower(pi.name) like lower(concat('%', :search, '%'))
                or lower(pc.category.code) like lower(concat('%', :search, '%'))
                or lower(ci.name) like lower(concat('%', :search, '%'))
              )
            """)
    Page<Product> searchForCrmByStatus(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable
    );
}
