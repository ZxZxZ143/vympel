package com.shop.vympel.services.product;

import com.shop.vympel.dtos.product.ProductBulkCommonRequest;
import com.shop.vympel.dtos.product.ProductBulkCreateRequest;
import com.shop.vympel.dtos.product.ProductBulkCreateResponse;
import com.shop.vympel.dtos.product.ProductBulkRowRequest;
import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.dtos.product.details.AccessoryDetailCreateRequest;
import com.shop.vympel.dtos.product.details.AccessoryDetailUpdateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductBulkCreationServiceTest {
    @Test
    void bulkRowsMergeOptionalAccessoryCharacteristicsWithoutDefaults() {
        ProductService productService = mock(ProductService.class);
        ProductResponse createdProduct = mock(ProductResponse.class);
        when(productService.create(any())).thenReturn(42L);
        when(productService.get(42L, Language.RU)).thenReturn(createdProduct);
        when(createdProduct.getId()).thenReturn(42L);
        when(createdProduct.getSku()).thenReturn("ACC-42");
        ProductBulkCreationService service = new ProductBulkCreationService(productService);

        ProductBulkCommonRequest common = new ProductBulkCommonRequest();
        common.setBrandId(1L);
        common.setStatus("DRAFT");
        common.setProductType("ACCESSORY");
        AccessoryDetailCreateRequest commonDetails = new AccessoryDetailCreateRequest();
        commonDetails.setColorId(30L);
        commonDetails.setHasInsert(false);
        common.setAccessoryDetails(commonDetails);

        ProductBulkRowRequest row = new ProductBulkRowRequest();
        ProductNameCreateRequest name = new ProductNameCreateRequest();
        name.setName_ru("Аксессуар");
        row.setProductName(name);
        row.setModel("ACC");
        row.setPrice(1);
        row.setStockQuantity(1);
        AccessoryDetailUpdateRequest rowDetails = new AccessoryDetailUpdateRequest();
        rowDetails.setLength("45 cm");
        row.setAccessoryDetails(rowDetails);

        ProductBulkCreateRequest request = new ProductBulkCreateRequest();
        request.setCategoryId(10L);
        request.setCommon(common);
        request.setRows(List.of(row));

        ProductBulkCreateResponse response = service.createBulk(request, Language.RU);

        assertThat(response.createdCount()).isEqualTo(1);
        org.mockito.ArgumentCaptor<ProductCreateRequest> captor = org.mockito.ArgumentCaptor.forClass(ProductCreateRequest.class);
        verify(productService).create(captor.capture());
        assertThat(captor.getValue().getAccessoryDetails().getColorId()).isEqualTo(30L);
        assertThat(captor.getValue().getAccessoryDetails().getHasInsert()).isFalse();
        assertThat(captor.getValue().getAccessoryDetails().getLength()).isEqualTo("45 cm");
        assertThat(captor.getValue().getAccessoryDetails().getClaspType()).isNull();
    }

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
