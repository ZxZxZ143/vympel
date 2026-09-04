package com.shop.vympel.services.product;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SKUServiceTest {
    @Test
    void collisionSuffixKeepsTheGeneratedSkuWithinTheDatabaseLimit() {
        SKUService service = new SKUService(null, null, null, null, null, null, null, null);

        String sku = service.withCollisionSuffix("S".repeat(160));

        assertThat(sku).hasSize(120);
        assertThat(sku).matches("S{111}-[A-F0-9]{8}");
    }
}
