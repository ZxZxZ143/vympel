package com.shop.vympel.dtos.product;

import com.shop.vympel.services.catalog.CatalogCategoryProfile;

import java.util.List;

public record WildberriesProductImportResponse(
        String source,
        String sourceUrl,
        Long categoryId,
        CatalogCategoryProfile categoryProfile,
        Values values,
        List<KaspiProductImportResponse.MappedField> mappedFields,
        List<KaspiProductImportResponse.MappedCharacteristic> mappedCharacteristics,
        List<KaspiProductImportResponse.UnmappedCharacteristic> unmappedCharacteristics,
        List<KaspiProductImportResponse.UnresolvedCharacteristic> unresolvedCharacteristics,
        List<String> warnings
) {
    public record Values(
            String nameRu,
            Long brandId,
            String model,
            Integer price,
            String descriptionRu,
            String wildberriesUrl,
            KaspiProductImportResponse.WatchDetails watchDetails,
            KaspiProductImportResponse.InteriorClockDetails interiorClockDetails,
            KaspiProductImportResponse.AccessoryDetails accessoryDetails
    ) {
    }
}
