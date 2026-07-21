package com.shop.vympel.mappers.product;

import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProductDescriptionMapperTest {
    private final ProductDescriptionMapper mapper = Mappers.getMapper(ProductDescriptionMapper.class);

    @Test
    void longDescriptionIsStoredOnlyAsContent() {
        String description = "x".repeat(500);

        var entity = mapper.toEntity(new DescriptionCreateRequest(description));

        assertNull(entity.getTitle());
        assertNull(entity.getShortText());
        assertEquals(description, entity.getContentMd());
    }
}
