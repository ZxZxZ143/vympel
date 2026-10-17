package com.shop.vympel.dtos.cms;

import java.util.Map;

public record CmsCategoryBannerResponse(
        String categoryCode, String parentCode, Map<String, String> names,
        String explicitBlockKey, String effectiveBlockKey, String sourceCategoryCode,
        String mode, boolean hasChildren
) {}
