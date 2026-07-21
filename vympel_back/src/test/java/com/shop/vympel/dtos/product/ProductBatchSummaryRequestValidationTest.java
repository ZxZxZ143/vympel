package com.shop.vympel.dtos.product;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProductBatchSummaryRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsEmptyOversizedAndNonPositiveIdLists() {
        List<Long> oversized = new ArrayList<>();
        for (long id = 1; id <= 61; id++) {
            oversized.add(id);
        }

        assertThat(validator.validate(new ProductBatchSummaryRequest(List.of()))).isNotEmpty();
        assertThat(validator.validate(new ProductBatchSummaryRequest(oversized))).isNotEmpty();
        assertThat(validator.validate(new ProductBatchSummaryRequest(List.of(1L, 0L)))).isNotEmpty();
    }

    @Test
    void acceptsTheMaximumPositiveIdList() {
        List<Long> maximum = new ArrayList<>();
        for (long id = 1; id <= 60; id++) {
            maximum.add(id);
        }

        assertThat(validator.validate(new ProductBatchSummaryRequest(maximum))).isEmpty();
    }
}
