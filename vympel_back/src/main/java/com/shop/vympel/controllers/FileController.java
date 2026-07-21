package com.shop.vympel.controllers;

import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.crm.CrmActivityService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/file")
@RequiredArgsConstructor
public class FileController {
    private final ObjectStorageService objectStorageService;
    private final CrmActivityService crmActivityService;

    @PostMapping(value = "/product/{productId}/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<String>> uploadImages(
            @RequestPart("files") List<MultipartFile> file,
            @PathVariable Long productId,
            HttpServletRequest request
    ) throws IOException {
        List<String> keys = objectStorageService.uploadProductImage(file, productId);
        crmActivityService.log(
                "PRODUCT_IMAGES_UPLOADED",
                "PRODUCT",
                productId,
                Map.of("count", keys.size(), "source", "ADMIN_API"),
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(keys);
    }
}
