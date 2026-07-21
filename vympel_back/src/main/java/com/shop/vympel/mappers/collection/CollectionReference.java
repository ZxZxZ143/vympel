package com.shop.vympel.mappers.collection;

import com.shop.vympel.db.entity.features.Brand;
import com.shop.vympel.db.repositories.product.features.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.mapstruct.Named;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CollectionReference {
    private final BrandRepository brandRepository;

    @Named("toBrand")
    Brand toBrand(Long id) {
        return id == null ? null : brandRepository.getReferenceById(id);
    }
}
