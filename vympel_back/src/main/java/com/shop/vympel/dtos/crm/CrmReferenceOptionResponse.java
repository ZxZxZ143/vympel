package com.shop.vympel.dtos.crm;

public record CrmReferenceOptionResponse(
        Long id,
        String name,
        String code,
        Long brandId
) {
    public CrmReferenceOptionResponse(Long id, String name, String code) {
        this(id, name, code, null);
    }
}
