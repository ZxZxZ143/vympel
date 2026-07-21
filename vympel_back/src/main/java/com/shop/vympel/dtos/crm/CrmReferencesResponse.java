package com.shop.vympel.dtos.crm;

import com.shop.vympel.dtos.category.CategoryResponse;

import java.util.List;

public record CrmReferencesResponse(
        List<CategoryResponse> categories,
        List<CrmReferenceOptionResponse> brands,
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
}
