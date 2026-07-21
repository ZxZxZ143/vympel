package com.shop.vympel.mappers.product;

import com.shop.vympel.db.entity.features.ProductDescriptionI18n;
import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.DescriptionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductDescriptionMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "title", ignore = true)
    @Mapping(target = "shortText", ignore = true)
    @Mapping(target = "contentMd", source = "desc")
    ProductDescriptionI18n toEntity(DescriptionCreateRequest descriptionCreateRequest);

    @Mapping(target = "content", source = "contentMd")
    DescriptionResponse toResponse(ProductDescriptionI18n productDescriptionI18n);
}
