package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CollectionRepository extends JpaRepository<Collection, Long> {
    Optional<Collection> findByBrand_IdAndCode(Long brandId, String code);

    List<Collection> findAllByBrand_Id(Long brandId);

    @Query("select c from Collection c join fetch c.brand")
    List<Collection> findAllWithBrand();

    @Query("select c from Collection c join fetch c.brand where c.brand.id = :brandId")
    List<Collection> findAllWithBrandByBrandId(@Param("brandId") Long brandId);
}
