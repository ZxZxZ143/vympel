package com.shop.vympel.services.collection;

import com.shop.vympel.dtos.collection.CollectionCreateRequest;
import com.shop.vympel.dtos.collection.CollectionResponse;

public interface CollectionService {
    CollectionResponse toCreate(CollectionCreateRequest request) throws IllegalArgumentException;
}
