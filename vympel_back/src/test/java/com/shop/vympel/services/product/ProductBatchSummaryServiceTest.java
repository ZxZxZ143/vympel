package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository;
import com.shop.vympel.db.repositories.product.PublicProductSummaryRepository.PublicProductSummary;
import com.shop.vympel.dtos.product.ProductBatchSummaryResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import java.math.BigDecimal;
import java.util.List;
import java.util.LinkedHashSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductBatchSummaryServiceTest {
    @Mock PublicProductSummaryRepository summaryRepository;
    @Mock ObjectStorageService objectStorageService;

    @Test
    void deduplicatesPreservesFirstOccurrenceAndReportsInactiveOrMissingIds() {
        ProductBatchSummaryService service = new ProductBatchSummaryService(
                summaryRepository, objectStorageService, new SimpleMeterRegistry());
        when(summaryRepository.findAllByIds(new LinkedHashSet<>(List.of(3L, 1L, 2L)), "kk"))
                .thenReturn(List.of(summary(1L), summary(3L)));
        when(objectStorageService.getPublicLink("products/3.jpg")).thenReturn("public/3.jpg");
        when(objectStorageService.getPublicLink("products/1.jpg")).thenReturn("public/1.jpg");

        ProductBatchSummaryResponse response = service.getSummaries(List.of(3L, 1L, 3L, 2L), Language.KZ);

        assertThat(response.items()).extracting(item -> item.id()).containsExactly(3L, 1L);
        assertThat(response.missingIds()).containsExactly(2L);
        assertThat(response.items().get(0).imageUrl()).isEqualTo("public/3.jpg");
        verify(summaryRepository).findAllByIds(new LinkedHashSet<>(List.of(3L, 1L, 2L)), "kk");
    }

    private PublicProductSummary summary(long id) {
        return new PublicProductSummary(
                id, "Product " + id, "M" + id, "SKU" + id, new BigDecimal("100"),
                4, "ACTIVE", "products/" + id + ".jpg", null, null,
                10L, "Collection", 20L, "Brand", "WATCH", "Watches", 4.5, 2L
        );
    }
}
