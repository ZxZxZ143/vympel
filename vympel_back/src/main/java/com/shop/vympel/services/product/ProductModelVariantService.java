package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.product.ProductModelVariantRepository;
import com.shop.vympel.db.repositories.product.ProductModelVariantRow;
import com.shop.vympel.dtos.product.ProductModelVariantGroupResponse;
import com.shop.vympel.dtos.product.ProductModelVariantResponse;
import com.shop.vympel.dtos.product.image.ProductImageResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductModelVariantService {
    public static final int MAX_VARIANTS_PER_GROUP = 24;
    private static final int MAX_CRM_ANCHORS = 100;

    private final ProductModelVariantRepository productModelVariantRepository;
    private final ObjectStorageService objectStorageService;

    @Transactional(readOnly = true)
    public ProductModelVariantGroupResponse getPublicGroup(Long productId, Language language) {
        return groupsFor(List.of(productId), language, true)
                .getOrDefault(productId, ProductModelVariantGroupResponse.empty());
    }

    @Transactional(readOnly = true)
    public ProductModelVariantGroupResponse getCrmGroup(Long productId, Language language) {
        return groupsFor(List.of(productId), language, false)
                .getOrDefault(productId, ProductModelVariantGroupResponse.empty());
    }

    @Transactional(readOnly = true)
    public Map<Long, ProductModelVariantGroupResponse> getCrmGroups(
            Collection<Long> productIds,
            Language language
    ) {
        return groupsFor(productIds, language, false);
    }

    private Map<Long, ProductModelVariantGroupResponse> groupsFor(
            Collection<Long> productIds,
            Language language,
            boolean publicOnly
    ) {
        List<Long> anchorIds = productIds == null
                ? List.of()
                : productIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (anchorIds.isEmpty()) {
            return Map.of();
        }
        if (anchorIds.size() > MAX_CRM_ANCHORS) {
            throw new IllegalArgumentException("At most 100 product variant groups can be requested at once");
        }

        Map<Long, List<ProductModelVariantRow>> rowsByAnchor = new LinkedHashMap<>();
        productModelVariantRepository.findModelVariantRows(
                        anchorIds,
                        language.getValue(),
                        publicOnly,
                        MAX_VARIANTS_PER_GROUP
                )
                .forEach(row -> rowsByAnchor
                        .computeIfAbsent(row.getAnchorId(), ignored -> new ArrayList<>())
                        .add(row));

        Map<Long, ProductModelVariantGroupResponse> groups = new LinkedHashMap<>();
        anchorIds.forEach(anchorId -> groups.put(
                anchorId,
                toGroup(rowsByAnchor.getOrDefault(anchorId, List.of()))
        ));
        return groups;
    }

    private ProductModelVariantGroupResponse toGroup(List<ProductModelVariantRow> rows) {
        if (rows.isEmpty()) {
            return ProductModelVariantGroupResponse.empty();
        }

        List<ProductModelVariantRow> orderedRows = rows.stream()
                .sorted(Comparator.comparing(ProductModelVariantRow::getVariantOrder))
                .toList();
        int total = Math.toIntExact(Math.min(Integer.MAX_VALUE, orderedRows.get(0).getVariantCount()));
        List<ProductModelVariantResponse> variants = orderedRows.stream()
                .map(this::toVariant)
                .toList();

        return new ProductModelVariantGroupResponse(
                orderedRows.get(0).getModel(),
                total,
                total > variants.size(),
                variants
        );
    }

    private ProductModelVariantResponse toVariant(ProductModelVariantRow row) {
        ProductImageResponse image = row.getImageId() == null || row.getImageKey() == null
                ? null
                : new ProductImageResponse(
                        row.getImageId(),
                        objectStorageService.getPublicLink(row.getImageKey()),
                        row.getName(),
                        row.getImageSortOrder(),
                        Boolean.TRUE.equals(row.getImageMain())
                );
        return new ProductModelVariantResponse(
                row.getId(),
                row.getName(),
                row.getModel(),
                row.getStatus(),
                image
        );
    }
}
