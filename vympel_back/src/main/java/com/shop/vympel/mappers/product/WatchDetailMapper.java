package com.shop.vympel.mappers.product;

import com.shop.vympel.db.entity.product.WatchDetail;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailResponse;
import com.shop.vympel.dtos.product.details.WatchDetailUpdateRequest;
import com.shop.vympel.enums.Language;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {EntityReferenceMapper.class})
public interface WatchDetailMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "mechanism", source = "mechanismId", qualifiedByName = "toMechanism")
    @Mapping(target = "gender", source = "genderId", qualifiedByName = "toGender")
    @Mapping(target = "caseMaterial", source = "caseMaterialId", qualifiedByName = "toMaterial")
    @Mapping(target = "strapMaterial", source = "strapMaterialId", qualifiedByName = "toMaterial")
    @Mapping(target = "glassType", source = "glassTypeId", qualifiedByName = "toGlassType")
    @Mapping(target = "stoneInlay", source = "stoneInlayId", qualifiedByName = "toStoneInlay")
    WatchDetail toEntity(WatchDetailCreateRequest req);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)

    @Mapping(target = "mechanism", source = "mechanismId", qualifiedByName = "toMechanism")
    @Mapping(target = "gender", source = "genderId", qualifiedByName = "toGender")
    @Mapping(target = "caseMaterial", source = "caseMaterialId", qualifiedByName = "toMaterial")
    @Mapping(target = "strapMaterial", source = "strapMaterialId", qualifiedByName = "toMaterial")
    @Mapping(target = "glassType", source = "glassTypeId", qualifiedByName = "toGlassType")
    @Mapping(target = "stoneInlay", source = "stoneInlayId", qualifiedByName = "toStoneInlay")
    void updateEntity(@MappingTarget WatchDetail entity, WatchDetailUpdateRequest req);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "mechanism", source = ".", qualifiedByName = "toMechanismResponse")
    @Mapping(target = "gender", source = ".", qualifiedByName = "toGenderResponse")
    @Mapping(target = "caseMaterial", source = ".", qualifiedByName = "toCaseMaterialResponse")
    @Mapping(target = "strapMaterial", source = ".", qualifiedByName = "toStrapMaterialResponse")
    @Mapping(target = "glassType", source = ".", qualifiedByName = "toGlassTypeResponse")
    @Mapping(target = "stoneInlay", source = ".", qualifiedByName = "toStoneInlayResponse")
    WatchDetailResponse toResponse(WatchDetail entity, @Context Language lang);
}