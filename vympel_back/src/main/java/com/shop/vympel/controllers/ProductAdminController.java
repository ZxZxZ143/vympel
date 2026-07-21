package com.shop.vympel.controllers;

import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.services.crm.CrmActivityService;
import jakarta.validation.Valid;
import com.shop.vympel.services.product.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/product")
@AllArgsConstructor
public class ProductAdminController {

    private final ProductService productService;
    private final CrmActivityService crmActivityService;

    @PostMapping("/create")
    public ResponseEntity<Long> create(
            @RequestBody @Valid ProductCreateRequest productCreateRequest,
            HttpServletRequest request
    ) {
        Long productId = productService.create(productCreateRequest);
        crmActivityService.log(
                "PRODUCT_CREATED",
                "PRODUCT",
                productId,
                Map.of("source", "ADMIN_API"),
                request
        );
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productId);
    }
}
