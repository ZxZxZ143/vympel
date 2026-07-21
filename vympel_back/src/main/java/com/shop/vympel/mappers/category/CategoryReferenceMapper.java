package com.shop.vympel.mappers.category;

import com.shop.vympel.db.entity.i18n.CategoryI18n;
import com.shop.vympel.db.entity.i18n.CategoryI18nId;
import com.shop.vympel.db.repositories.category.CategoryI18Repository;
import com.shop.vympel.enums.Language;
import lombok.RequiredArgsConstructor;
import org.mapstruct.Context;
import org.mapstruct.Named;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CategoryReferenceMapper {
    private final CategoryI18Repository categoryI18nRepository;

    @Named("categoryName")
    public String toName(Long categoryId, @Context Language language) {
        CategoryI18nId categoryI18nId = new CategoryI18nId();
        categoryI18nId.setId(categoryId);
        categoryI18nId.setLang(language.getValue());

        CategoryI18n categoryI18n = categoryI18nRepository
                .findById(categoryI18nId)
                .orElseThrow(() -> new RuntimeException("CategoryI18n not found"));

        return categoryI18n.getName();
    }
}
