package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmBrandCreateRequest;
import com.shop.vympel.dtos.crm.CrmBrandReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmCollectionResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.crm.CrmBrandService;
import com.shop.vympel.services.crm.CrmCollectionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/brands")
@RequiredArgsConstructor
public class CrmBrandCollectionController {
    private final CrmCollectionService crmCollectionService;
    private final CrmBrandService crmBrandService;
    private final CrmActivityService crmActivityService;

    @GetMapping("/{brandId}/collections")
    public List<CrmCollectionResponse> getBrandCollections(
            @PathVariable Long brandId,
            @RequestParam(defaultValue = "ru") String lang
    ) {
        return crmCollectionService.getByBrand(brandId, Language.from(lang));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CrmBrandReferenceOptionResponse createBrand(
            @RequestBody @Valid CrmBrandCreateRequest requestBody,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        CrmBrandReferenceOptionResponse brand = crmBrandService.create(requestBody, Language.from(lang));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("code", brand.code());
        metadata.put("name", brand.name());
        metadata.put("countryId", brand.countryId());
        metadata.put("countryCode", brand.countryCode());
        metadata.put("newCountry", requestBody.newCountry() != null);
        crmActivityService.log("BRAND_CREATED", "BRAND", brand.id(), metadata, request);

        return brand;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteBrand(@PathVariable Long id, HttpServletRequest request) {
        CrmBrandService.DeletedBrand deleted = crmBrandService.delete(id);
        crmActivityService.log(
                "BRAND_DELETED",
                "BRAND",
                id,
                Map.of("code", deleted.code(), "deletedCollections", deleted.deletedCollections()),
                request
        );
    }
}
