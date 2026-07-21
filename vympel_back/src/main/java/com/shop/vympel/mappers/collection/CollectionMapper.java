package com.shop.vympel.mappers.collection;

import com.shop.vympel.db.entity.features.Collection;
import com.shop.vympel.dtos.collection.CollectionCreateRequest;
import com.shop.vympel.dtos.collection.CollectionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = CollectionReference.class)
public abstract class CollectionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "brand", source = "brandId", qualifiedByName = "toBrand")
    @Mapping(target = "code", source = "name", qualifiedByName = "genCode")
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt",  ignore = true)
    @Mapping(target = "updatedAt",  ignore = true)
    public abstract Collection toEntity(CollectionCreateRequest request);

    @Mapping(target = "brandId", source = "brand.id")
    public abstract CollectionResponse toResponse(Collection collection);

    @Named("genCode")
    protected String genCode(String name) {
        return name.substring(0, 3).toUpperCase();
    }
}
