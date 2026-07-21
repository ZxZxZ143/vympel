package com.shop.vympel.mappers.category;

import com.shop.vympel.db.entity.product.Category;
import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.category.CategoryWithParentResponse;
import com.shop.vympel.enums.Language;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring", uses = {CategoryReferenceMapper.class})
public interface CategoryMapper {

    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "name", source = "id", qualifiedByName = "categoryName")
    CategoryResponse toResponse(Category category, @Context Language language);

    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "name", source = "id", qualifiedByName = "categoryName")
    List<CategoryResponse> toResponse(List<Category> category, @Context Language language);

    @Named("toCategoryWithParent")
    @Mapping(target = "name", source = "id", qualifiedByName = "categoryName")
    @Mapping(target = "parent", source = "parent", qualifiedByName = "toCategoryWithParent")
    CategoryWithParentResponse toResponseWithParent(Category category, @Context Language language);
}
