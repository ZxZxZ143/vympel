package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmCollectionResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmCollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crm/brands")
@RequiredArgsConstructor
public class CrmBrandCollectionController {
    private final CrmCollectionService crmCollectionService;

    @GetMapping("/{brandId}/collections")
    public List<CrmCollectionResponse> getBrandCollections(
            @PathVariable Long brandId,
            @RequestParam(defaultValue = "ru") String lang
    ) {
        return crmCollectionService.getByBrand(brandId, Language.from(lang));
    }
}
