package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmReferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crm/references")
@RequiredArgsConstructor
public class CrmReferenceController {
    private final CrmReferenceService crmReferenceService;

    @GetMapping
    public CrmReferencesResponse getReferences(@RequestParam(defaultValue = "ru") String lang) {
        return crmReferenceService.getReferences(Language.from(lang));
    }
}
