package com.shop.vympel.services.product;

import com.shop.vympel.dtos.product.ProductBulkCommonRequest;
import com.shop.vympel.dtos.product.ProductBulkCreateRequest;
import com.shop.vympel.dtos.product.ProductBulkCreateResponse;
import com.shop.vympel.dtos.product.ProductBulkRowRequest;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductBulkCreationServiceTest {
    @Test
    void bulkRowsReturnTheAuthoritativeBrandCountryValidationError() {
        ProductService productService = mock(ProductService.class);
        when(productService.create(any())).thenThrow(new BusinessRuleViolationException(
                "BRAND_COUNTRY_MISMATCH",
                "Production country must match the selected brand."
        ));
        ProductBulkCreationService service = new ProductBulkCreationService(productService);

        ProductBulkCommonRequest common = new ProductBulkCommonRequest();
        common.setBrandId(1L);
        common.setStatus("DRAFT");
        common.setProductType("WATCH");
        ProductBulkRowRequest row = new ProductBulkRowRequest();
        ProductNameCreateRequest name = new ProductNameCreateRequest();
        name.setName_ru("Тест");
        row.setProductName(name);
        row.setModel("MODEL");
        row.setPrice(1);
        row.setStockQuantity(1);
        ProductBulkCreateRequest request = new ProductBulkCreateRequest();
        request.setCategoryId(1L);
        request.setCommon(common);
        request.setRows(List.of(row));

        ProductBulkCreateResponse response = service.createBulk(request, Language.RU);

        assertThat(response.createdCount()).isZero();
        assertThat(response.failedCount()).isEqualTo(1);
        assertThat(response.errors().get(0).message()).contains("must match");
    }
}
