package com.shop.vympel.dtos.crm;

public record CrmBrandReferenceOptionResponse(
        Long id,
        String name,
        String code,
        Long countryId,
        String countryCode,
        String countryName
) {
}
