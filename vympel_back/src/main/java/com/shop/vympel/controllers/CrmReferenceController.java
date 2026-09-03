package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmReferenceCreateRequest;
import com.shop.vympel.dtos.crm.CrmReferenceOptionResponse;
import com.shop.vympel.dtos.crm.CrmReferencesResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.crm.CrmReferenceMutationService;
import com.shop.vympel.services.crm.CrmReferenceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/crm/references")
@RequiredArgsConstructor
public class CrmReferenceController {
    private final CrmReferenceService crmReferenceService;
    private final CrmReferenceMutationService crmReferenceMutationService;
    private final CrmActivityService crmActivityService;

    @GetMapping
    public CrmReferencesResponse getReferences(@RequestParam(defaultValue = "ru") String lang) {
        return crmReferenceService.getReferences(Language.from(lang));
    }

    @PostMapping("/{type}")
    @ResponseStatus(HttpStatus.CREATED)
    @org.springframework.transaction.annotation.Transactional
    public CrmReferenceOptionResponse createReference(
            @PathVariable String type,
            @RequestBody @Valid CrmReferenceCreateRequest requestBody,
            @RequestParam(defaultValue = "ru") String lang,
            HttpServletRequest servletRequest
    ) {
        CrmReferenceOptionResponse created = crmReferenceMutationService.create(
                type,
                requestBody,
                Language.from(lang)
        );
        crmActivityService.log(
                "REFERENCE_VALUE_CREATED",
                "REFERENCE_VALUE",
                created.id(),
                Map.of("type", type, "code", created.code(), "name", created.name()),
                servletRequest
        );
        return created;
    }
}
