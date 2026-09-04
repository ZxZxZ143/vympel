package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.product.ProductModelVariantRepository;
import com.shop.vympel.db.repositories.product.ProductModelVariantRow;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductModelVariantServiceTest {
    @Mock
    private ProductModelVariantRepository repository;

    @Mock
    private ObjectStorageService objectStorageService;

    @Test
    void publicGroupUsesThePublicFilterAndBuildsMainImageUrlsWithoutExtraQueries() {
        ProductModelVariantRow current = row(12L, 12L, 1L, 2L, "current.jpg", 2L);
        ProductModelVariantRow sibling = row(12L, 13L, 2L, null, null, 2L);
        when(repository.findModelVariantRows(List.of(12L), "ru", true, 24))
                .thenReturn(List.of(current, sibling));
        when(objectStorageService.getPublicLink("current.jpg")).thenReturn("https://media.test/current.jpg");

        var group = new ProductModelVariantService(repository, objectStorageService)
                .getPublicGroup(12L, Language.RU);

        assertThat(group.total()).isEqualTo(2);
        assertThat(group.truncated()).isFalse();
        assertThat(group.variants()).extracting(variant -> variant.id()).containsExactly(12L, 13L);
        assertThat(group.variants().get(0).mainImage().url()).isEqualTo("https://media.test/current.jpg");
        assertThat(group.variants().get(1).mainImage()).isNull();
    }

    @Test
    void batchGroupsStayBoundedAndReportTruncation() {
        List<ProductModelVariantRow> rows = new ArrayList<>();
        for (long index = 1; index <= 24; index++) {
            rows.add(row(12L, 100L + index, index, null, null, 30L));
        }
        when(repository.findModelVariantRows(List.of(12L), "en", false, 24)).thenReturn(rows);

        var group = new ProductModelVariantService(repository, objectStorageService)
                .getCrmGroup(12L, Language.EN);

        assertThat(group.total()).isEqualTo(30);
        assertThat(group.variants()).hasSize(24);
        assertThat(group.truncated()).isTrue();
    }

    @Test
    void rejectsAnUnboundedCrmAnchorRequestBeforeQuerying() {
        List<Long> ids = java.util.stream.LongStream.rangeClosed(1, 101).boxed().toList();
        var service = new ProductModelVariantService(repository, objectStorageService);

        assertThatThrownBy(() -> service.getCrmGroups(ids, Language.RU))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100");
    }

    @Test
    void usesOneRepositoryCallForEveryAnchorOnTheCurrentCrmPage() {
        when(repository.findModelVariantRows(List.of(12L, 13L, 14L), "kk", false, 24))
                .thenReturn(List.of());
        var service = new ProductModelVariantService(repository, objectStorageService);

        service.getCrmGroups(List.of(12L, 13L, 14L), Language.KZ);

        ArgumentCaptor<List<Long>> ids = ArgumentCaptor.forClass(List.class);
        verify(repository).findModelVariantRows(ids.capture(), org.mockito.ArgumentMatchers.eq("kk"),
                org.mockito.ArgumentMatchers.eq(false), org.mockito.ArgumentMatchers.eq(24));
        assertThat(ids.getValue()).containsExactly(12L, 13L, 14L);
    }

    private ProductModelVariantRow row(
            Long anchorId,
            Long id,
            Long order,
            Long imageId,
            String imageKey,
            Long count
    ) {
        ProductModelVariantRow row = mock(ProductModelVariantRow.class);
        when(row.getAnchorId()).thenReturn(anchorId);
        when(row.getId()).thenReturn(id);
        when(row.getName()).thenReturn("Variant " + id);
        when(row.getModel()).thenReturn("TL4247HM");
        when(row.getStatus()).thenReturn("ACTIVE");
        when(row.getVariantOrder()).thenReturn(order);
        lenient().when(row.getVariantCount()).thenReturn(count);
        when(row.getImageId()).thenReturn(imageId);
        lenient().when(row.getImageKey()).thenReturn(imageKey);
        if (imageId != null) {
            when(row.getImageSortOrder()).thenReturn(0);
            when(row.getImageMain()).thenReturn(true);
        }
        return row;
    }
}
