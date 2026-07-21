package com.shop.vympel.mappers.product;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.product.ProductUpdateRequest;
import com.shop.vympel.enums.Language;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring", uses = {EntityReferenceMapper.class})
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sku",  ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "brand", source = "brandId", qualifiedByName = "toBrand")
    @Mapping(target = "collection", source = "collectionId", qualifiedByName = "toCollection")
    @Mapping(target = "model", source = "model", qualifiedByName = "modelToUpper")
    Product toEntity(ProductCreateRequest req, @Context EntityReferenceMapper ref);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sku",  ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "brand", source = "brandId", qualifiedByName = "toBrand")
    @Mapping(target = "collection", source = "collectionId", qualifiedByName = "toCollection")
    @Mapping(target = "model", source = "model", qualifiedByName = "modelToUpper")
    void updateEntity(@MappingTarget Product entity, ProductUpdateRequest req, @Context EntityReferenceMapper ref);

    @Mapping(target = "brand", source = ".", qualifiedByName = "toBrandResponse")
    @Mapping(target = "collection", source = ".", qualifiedByName = "toCollectionResponse")
    @Mapping(target = "price", expression = "java(toIntegerPrice(entity.getPrice()))")
    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "descriptionTranslations", ignore = true)
    @Mapping(target = "watchDetails", ignore = true)
    @Mapping(target = "interiorClockDetails", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "ratingAverage", ignore = true)
    @Mapping(target = "ratingCount", ignore = true)
    ProductResponse toResponse(Product entity, @Context Language lang);

    @Mapping(target = "brand", source = ".", qualifiedByName = "toBrandResponse")
    @Mapping(target = "collection", source = ".", qualifiedByName = "toCollectionResponse")
    @Mapping(target = "price", expression = "java(toIntegerPrice(entity.getPrice()))")
    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "descriptionTranslations", ignore = true)
    @Mapping(target = "watchDetails", ignore = true)
    @Mapping(target = "interiorClockDetails", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "ratingAverage", ignore = true)
    @Mapping(target = "ratingCount", ignore = true)
    List<ProductResponse> toResponse(List<Product> entities, @Context Language lang);

    @Mapping(target = "price", expression = "java(toIntegerPrice(entity.getPrice()))")
    @Mapping(target = "ratingAverage", ignore = true)
    @Mapping(target = "ratingCount", ignore = true)
    ProductShortResponse toShortResponse(Product entity);

    default Integer toIntegerPrice(BigDecimal price) {
        return price == null ? null : price.intValue();
    }

    @Named("modelToUpper")
    default String modelToUpper(String model) {
        return model == null ? null : model.toUpperCase();
    };
}
