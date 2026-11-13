package com.shop.vympel.dtos.crm;

/**
 * Brand option for CRM selects. {@code deletable} is false for brands that own a storefront
 * landing page; whether a brand is still used by products is checked only when deleting.
 */
public record CrmBrandReferenceOptionResponse(
        Long id,
        String name,
        String code,
        Long countryId,
        String countryCode,
        String countryName,
        boolean deletable
) {
    public CrmBrandReferenceOptionResponse(
            Long id,
            String name,
            String code,
            Long countryId,
            String countryCode,
            String countryName
    ) {
        this(id, name, code, countryId, countryCode, countryName, false);
    }
}
