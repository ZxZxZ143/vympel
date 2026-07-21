package com.shop.vympel.controllers;

import com.shop.vympel.dtos.collection.CollectionCreateRequest;
import com.shop.vympel.dtos.collection.CollectionResponse;
import com.shop.vympel.services.collection.CollectionServiceImpl;
import com.shop.vympel.services.crm.CrmActivityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/collection")
@RequiredArgsConstructor
public class CollectionAdminController {
    private final CollectionServiceImpl collectionService;
    private final CrmActivityService crmActivityService;

    @PostMapping("/create")
    public ResponseEntity<CollectionResponse> createCollection(
            @RequestBody @Valid CollectionCreateRequest requestBody,
            HttpServletRequest request
    ) {
        CollectionResponse collection = collectionService.toCreate(requestBody);
        crmActivityService.log(
                "COLLECTION_CREATED",
                "COLLECTION",
                collection.getId() == null ? null : collection.getId().longValue(),
                Map.of("brandId", collection.getBrandId(), "source", "ADMIN_API"),
                request
        );
        return ResponseEntity.
                status(HttpStatus.CREATED)
                .body(collection);
    }
}
