package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmCollectionCreateRequest;
import com.shop.vympel.dtos.crm.CrmCollectionResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.crm.CrmCollectionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/collections")
@RequiredArgsConstructor
public class CrmCollectionController {
    private final CrmCollectionService crmCollectionService;
    private final CrmActivityService crmActivityService;

    @GetMapping
    public List<CrmCollectionResponse> getCollections(
            @RequestParam(defaultValue = "ru") String lang,
            @RequestParam(required = false) Long brandId
    ) {
        Language language = Language.from(lang);
        if (brandId == null) {
            return crmCollectionService.getAll(language);
        }

        return crmCollectionService.getByBrand(brandId, language);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CrmCollectionResponse createCollection(
            @RequestBody @Valid CrmCollectionCreateRequest requestBody,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest request
    ) {
        CrmCollectionResponse collection = crmCollectionService.create(requestBody, Language.from(lang));

        crmActivityService.log(
                "COLLECTION_CREATED",
                "COLLECTION",
                collection.id(),
                metadata("brandId", collection.brandId(), "code", collection.code(), "name", collection.name()),
                request
        );

        return collection;
    }

    private Map<String, Object> metadata(Object... values) {
        Map<String, Object> metadata = new HashMap<>();
        for (int index = 0; index + 1 < values.length; index += 2) {
            metadata.put(String.valueOf(values[index]), values[index + 1]);
        }
        return metadata;
    }
}
