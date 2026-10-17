package com.shop.vympel.dtos.crm;

public record CrmReferenceOptionResponse(
        Long id,
        String name,
        String code,
        Long brandId
) {
    @com.fasterxml.jackson.annotation.JsonProperty("deletable")
    public boolean deletable() {
        return code != null && code.matches("CRM_[0-9A-F]{16}");
    }

    public CrmReferenceOptionResponse(Long id, String name, String code) {
        this(id, name, code, null);
    }
}
