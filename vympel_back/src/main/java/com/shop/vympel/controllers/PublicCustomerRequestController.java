package com.shop.vympel.controllers;

import com.shop.vympel.dtos.request.PublicCustomerRequestCreateRequest;
import com.shop.vympel.dtos.request.PublicCustomerRequestResponse;
import com.shop.vympel.services.request.CustomerRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/requests")
@RequiredArgsConstructor
public class PublicCustomerRequestController {
    private final CustomerRequestService customerRequestService;

    @PostMapping
    public ResponseEntity<PublicCustomerRequestResponse> create(
            @RequestBody @Valid PublicCustomerRequestCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerRequestService.create(request));
    }
}
