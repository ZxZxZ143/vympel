package com.shop.vympel.services.collection;

import com.shop.vympel.db.entity.features.Collection;
import com.shop.vympel.db.repositories.product.features.CollectionRepository;
import com.shop.vympel.dtos.collection.CollectionCreateRequest;
import com.shop.vympel.dtos.collection.CollectionResponse;
import com.shop.vympel.mappers.collection.CollectionMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {
    private final CollectionRepository collectionRepository;
    private final CollectionMapper collectionMapper;

    @Override
    @Transactional
    public CollectionResponse toCreate(CollectionCreateRequest request) throws IllegalArgumentException {
        Collection collection = collectionMapper.toEntity(request);

        Collection isExists = collectionRepository
                .findByBrand_IdAndCode(collection.getBrand().getId(), collection.getCode())
                .orElse(null);

        if (isExists != null) {
            throw new IllegalArgumentException("Collection with code " + collection.getCode() + " already exists");
        }

        collectionRepository.save(collection);
        return collectionMapper.toResponse(collection);
    }


}
