package com.shop.vympel.services.product;

import com.shop.vympel.dtos.crm.QuickDiscountUpdateRequest;
import com.shop.vympel.dtos.product.*;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;

class ProductPricingTest {
    @Test void derivesWholeTengeWithoutChangingBasePrice() {
        assertThat(ProductPricing.finalPrice(1001, 50)).isEqualTo(501);
        assertThat(ProductPricing.finalPrice(Integer.MAX_VALUE, 99)).isEqualTo(21474836);
        assertThat(ProductPricing.finalPrice(0, 99)).isZero();
        assertThat(ProductPricing.finalPrice(1999, null)).isEqualTo(1999);
        assertThat(ProductPricing.finalPrice(null, null)).isNull();
        for (int value : new int[]{0, -1, 100}) assertThatThrownBy(() -> ProductPricing.finalPrice(1000, value)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void rejectsFractionalAndOutOfRangeRequestValues() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            for (String invalid : new String[]{"0", "-1", "100", "1.5"})
                assertThat(factory.getValidator().validate(new QuickDiscountUpdateRequest(new BigDecimal(invalid)))).isNotEmpty();
            assertThat(factory.getValidator().validate(new QuickDiscountUpdateRequest(null))).isEmpty();
            assertThat(factory.getValidator().validate(new QuickDiscountUpdateRequest(new BigDecimal("99")))).isEmpty();
        }
    }
    @Test void serializesBaseDiscountAndFinalForDetailAndCards() {
        ProductResponse product = new ProductResponse();
        product.setPrice(1001); product.setDiscountPercent(50);
        var mapper = new ObjectMapper();
        for (Object dto : new Object[]{product, PublicProductResponse.from(product, ProductModelVariantGroupResponse.empty())}) {
            var json = mapper.readTree(mapper.writeValueAsString(dto));
            assertThat(json.get("price").asInt()).isEqualTo(1001);
            assertThat(json.get("discountPercent").asInt()).isEqualTo(50);
            assertThat(json.get("finalPrice").asInt()).isEqualTo(501);
        }
        ProductShortResponse card = new ProductShortResponse();
        card.setPrice(1001); card.setDiscountPercent(50);
        assertThat(card.getFinalPrice()).isEqualTo(501);
        product.setDiscountPercent(null);
        assertThat(product.getFinalPrice()).isEqualTo(1001);
    }
}
