package com.shop.vympel.dtos.crm;

import com.shop.vympel.dtos.category.CategoryResponse;

import java.util.List;

public record CrmReferencesResponse(
        List<CategoryResponse> categories,
        List<CrmBrandReferenceOptionResponse> brands,
        List<CrmReferenceOptionResponse> collections,
        List<CrmReferenceOptionResponse> mechanisms,
        List<CrmReferenceOptionResponse> genders,
        List<CrmReferenceOptionResponse> materials,
        List<CrmReferenceOptionResponse> glassTypes,
        List<CrmReferenceOptionResponse> stoneInlays,
        List<CrmReferenceOptionResponse> countries,
        List<CrmReferenceOptionResponse> interiorColors,
        List<CrmReferenceOptionResponse> interiorStyles,
        List<CrmReferenceOptionResponse> interiorMechanisms,
        List<CrmReferenceOptionResponse> interiorPowerTypes,
        List<CrmReferenceOptionResponse> watchDialTypes,
        List<CrmReferenceOptionResponse> watchDialMarkings,
        List<CrmReferenceOptionResponse> watchPowerSources,
        List<CrmReferenceOptionResponse> watchWaterResistances,
        List<CrmReferenceOptionResponse> watchFeatures
) {
    public CrmReferencesResponse(
            List<CategoryResponse> categories,
            List<CrmBrandReferenceOptionResponse> brands,
            List<CrmReferenceOptionResponse> collections,
            List<CrmReferenceOptionResponse> mechanisms,
            List<CrmReferenceOptionResponse> genders,
            List<CrmReferenceOptionResponse> materials,
            List<CrmReferenceOptionResponse> glassTypes,
            List<CrmReferenceOptionResponse> stoneInlays,
            List<CrmReferenceOptionResponse> countries,
            List<CrmReferenceOptionResponse> interiorColors,
            List<CrmReferenceOptionResponse> interiorStyles,
            List<CrmReferenceOptionResponse> interiorMechanisms,
            List<CrmReferenceOptionResponse> interiorPowerTypes
    ) {
        this(
                categories, brands, collections, mechanisms, genders, materials, glassTypes, stoneInlays,
                countries, interiorColors, interiorStyles, interiorMechanisms, interiorPowerTypes,
                List.of(), List.of(), List.of(), List.of(), List.of()
        );
    }
}
