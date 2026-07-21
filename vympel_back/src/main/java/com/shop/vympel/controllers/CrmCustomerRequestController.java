package com.shop.vympel.controllers;

import com.shop.vympel.dtos.request.CrmCustomerRequestCommentRequest;
import com.shop.vympel.dtos.request.CrmCustomerRequestResponse;
import com.shop.vympel.dtos.request.CrmCustomerRequestStatusUpdateRequest;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.request.CustomerRequestService;
import com.shop.vympel.utils.PageableUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/crm/requests")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@RequiredArgsConstructor
public class CrmCustomerRequestController {
    private static final int CRM_PAGE_MAX_SIZE = 100;
    private static final Sort DEFAULT_SORT = Sort.by(
            Sort.Order.desc("createdAt"),
            Sort.Order.desc("id")
    );

    private final CustomerRequestService customerRequestService;
    private final CrmActivityService crmActivityService;

    @GetMapping
    public Page<CrmCustomerRequestResponse> getRequests(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        return customerRequestService.getForCrm(
                status,
                search,
                PageableUtils.cap(pageable, CRM_PAGE_MAX_SIZE, DEFAULT_SORT)
        );
    }

    @GetMapping("/new-count")
    public Map<String, Long> getNewCount() {
        return Map.of("count", customerRequestService.newCount());
    }

    @GetMapping("/{id}")
    public CrmCustomerRequestResponse getOne(@PathVariable Long id) {
        return customerRequestService.getOne(id);
    }

    @PatchMapping("/{id}/status")
    public CrmCustomerRequestResponse updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid CrmCustomerRequestStatusUpdateRequest requestBody,
            Authentication authentication,
            HttpServletRequest request
    ) {
        CrmCustomerRequestResponse response = customerRequestService.updateStatus(
                id,
                requestBody.status(),
                authentication
        );
        logRequestAction("CUSTOMER_REQUEST_STATUS_CHANGED", response, request);
        return response;
    }

    @PatchMapping("/{id}/comment")
    public CrmCustomerRequestResponse updateComment(
            @PathVariable Long id,
            @RequestBody @Valid CrmCustomerRequestCommentRequest requestBody,
            HttpServletRequest request
    ) {
        CrmCustomerRequestResponse response = customerRequestService.updateComment(id, requestBody.adminComment());
        logRequestAction("CUSTOMER_REQUEST_COMMENT_CHANGED", response, request);
        return response;
    }

    @DeleteMapping("/{id}")
    public CrmCustomerRequestResponse cancel(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request
    ) {
        CrmCustomerRequestResponse response = customerRequestService.updateStatus(id, "CANCELLED", authentication);
        logRequestAction("CUSTOMER_REQUEST_CANCELLED", response, request);
        return response;
    }

    private void logRequestAction(
            String eventType,
            CrmCustomerRequestResponse response,
            HttpServletRequest request
    ) {
        crmActivityService.log(
                eventType,
                "CUSTOMER_REQUEST",
                response.id(),
                Map.of(
                        "status", response.status(),
                        "source", response.source() == null ? "" : response.source()
                ),
                request
        );
    }
}
