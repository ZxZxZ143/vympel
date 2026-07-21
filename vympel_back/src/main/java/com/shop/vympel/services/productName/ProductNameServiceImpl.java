package com.shop.vympel.services.productName;

import com.shop.vympel.db.entity.i18n.ProductI18n;
import com.shop.vympel.db.entity.i18n.ProductI18nId;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.product.Producti18nRepository;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class ProductNameServiceImpl implements ProductNameService {
    private final Producti18nRepository producti18nRepository;

    @Override
    @Transactional
    public void createProductName(Product product, Language language, String name) {
        ProductI18n productI18n = new ProductI18n();
        productI18n.setProduct(product);
        productI18n.setId(cretaeProductI18nId(
                product.getId(),
                language
        ));
        productI18n.setName(name);

        producti18nRepository.save(productI18n);
    }

    @Override
    public ProductI18n getById(Long productId, Language language) {
        return producti18nRepository
                .findProductI18nById(
                        cretaeProductI18nId(productId, language)
                )
                .orElseThrow(() -> new ResourceNotFoundException("Localized product name not found"));
    }

    @Override
    public ProductNameCreateRequest getTranslationsByProductId(Long productId) {
        return new ProductNameCreateRequest(
                getNameOrBlank(productId, Language.KZ),
                getNameOrBlank(productId, Language.RU),
                getNameOrBlank(productId, Language.EN)
        );
    }

    private ProductI18nId cretaeProductI18nId(Long productId, Language language) {
        ProductI18nId productI18nId = new ProductI18nId();
        productI18nId.setProductId(productId);
        productI18nId.setLang(language.getValue());

        return productI18nId;
    }

    private String getNameOrBlank(Long productId, Language language) {
        return producti18nRepository
                .findProductI18nById(cretaeProductI18nId(productId, language))
                .map(ProductI18n::getName)
                .orElse("");
    }
}
