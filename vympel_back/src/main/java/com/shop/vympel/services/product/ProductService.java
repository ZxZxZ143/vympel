package com.shop.vympel.services.product;

import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.product.ProductUpdateRequest;
import com.shop.vympel.enums.Language;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface ProductService {
    public Long create(ProductCreateRequest req);

    public ProductResponse update(Long id, ProductUpdateRequest req, Language language);

    public Boolean delete(Long id);

    public ProductResponse get(Long id, Language language);

    public Page<ProductShortResponse> getAll(Pageable pageable, Language language, Long categoryId);

    public Page<ProductShortResponse> getAllByCategoryCode(Pageable pageable, Language language, String categoryCode);

    public Page<ProductResponse> getAllForCrm(Pageable pageable, Language language, String search, String status);

    public ProductResponse updatePrice(Long id, Integer price, Language language);

    public ProductResponse updateStock(Long id, Integer stockQuantity, Language language);

    public ProductResponse updateStatus(Long id, String status, Language language);

    public ProductResponse updateMarketplaceLinks(Long id, String kaspiUrl, String wildberriesUrl, Language language);

    public ProductResponse updatePromotion(Long id, String promotionMode, Language language);

    public ProductResponse archive(Long id, Language language);
}
