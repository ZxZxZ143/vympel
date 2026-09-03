package com.shop.vympel.dtos.product;

import com.shop.vympel.services.catalog.CatalogCategoryProfile;

import java.util.List;

public record KaspiProductImportResponse(
        String source,
        String sourceUrl,
        Long categoryId,
        CatalogCategoryProfile categoryProfile,
        Values values,
        List<MappedField> mappedFields,
        List<MappedCharacteristic> mappedCharacteristics,
        List<UnmappedCharacteristic> unmappedCharacteristics,
        List<UnresolvedCharacteristic> unresolvedCharacteristics,
        List<String> warnings
) {
    public record Values(
            String nameRu,
            Long brandId,
            String model,
            Integer price,
            String descriptionRu,
            String kaspiUrl,
            WatchDetails watchDetails,
            InteriorClockDetails interiorClockDetails,
            AccessoryDetails accessoryDetails
    ) {
    }

    public record WatchDetails(
            Long mechanismId,
            Long genderId,
            Long caseMaterialId,
            Long strapMaterialId,
            Long glassTypeId,
            Integer caseSizeMm,
            String waterResistance,
            Long stoneInlayId,
            Long dialTypeId,
            Long dialMarkingId,
            Long powerSourceId,
            Long waterResistanceId,
            Long strapColorId,
            Long dialColorId,
            String packageContents,
            List<Long> featureIds
    ) {
        public WatchDetails(
                Long mechanismId,
                Long genderId,
                Long caseMaterialId,
                Long strapMaterialId,
                Long glassTypeId,
                Integer caseSizeMm,
                String waterResistance,
                Long stoneInlayId
        ) {
            this(
                    mechanismId, genderId, caseMaterialId, strapMaterialId, glassTypeId,
                    caseSizeMm, waterResistance, stoneInlayId,
                    null, null, null, null, null, null, null, List.of()
            );
        }
    }

    public record InteriorClockDetails(
            Long productionCountryId,
            Long caseMaterialId,
            Long colorId,
            Long styleId,
            Long mechanismTypeId,
            Long powerTypeId,
            String dimensions,
            Integer weightGrams,
            Integer warrantyMonths
    ) {
    }

    public record AccessoryDetails(
            String claspType,
            Long caseMaterialId,
            Long insertMaterialId,
            Boolean hasInsert,
            Long colorId,
            String length
    ) {
    }

    public record MappedField(String targetField, String resolvedValue) {
    }

    public record MappedCharacteristic(
            String sourceLabel,
            String sourceValue,
            String targetField,
            String resolvedValue,
            String resolution
    ) {
    }

    public record UnmappedCharacteristic(String sourceLabel, String sourceValue, String reason) {
    }

    public record UnresolvedCharacteristic(
            String sourceLabel,
            String sourceValue,
            String targetField,
            String reason
    ) {
    }
}
