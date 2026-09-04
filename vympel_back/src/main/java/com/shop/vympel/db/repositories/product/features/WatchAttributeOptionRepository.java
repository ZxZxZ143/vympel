package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.features.WatchAttributeOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WatchAttributeOptionRepository extends JpaRepository<WatchAttributeOption, Long> {
    List<WatchAttributeOption> findByOptionTypeAndActiveTrueOrderByCodeAsc(String optionType);
}
