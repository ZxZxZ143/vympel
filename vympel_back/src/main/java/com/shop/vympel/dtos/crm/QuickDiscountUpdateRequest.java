package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

public record QuickDiscountUpdateRequest(
        @DecimalMin("1") @DecimalMax("99") @Digits(integer = 2, fraction = 0)
        BigDecimal discountPercent
) {
    public Integer integerValue() {
        return discountPercent == null ? null : discountPercent.intValueExact();
    }
}
