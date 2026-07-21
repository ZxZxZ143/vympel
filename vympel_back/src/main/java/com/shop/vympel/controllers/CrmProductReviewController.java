package com.shop.vympel.controllers;

import com.shop.vympel.dtos.review.CrmProductReviewResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.services.review.ProductReviewService;
import com.shop.vympel.utils.PageableUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/reviews")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@RequiredArgsConstructor
public class CrmProductReviewController {
    private static final int CRM_PAGE_MAX_SIZE = 100;

    private final ProductReviewService productReviewService;
    private final CrmActivityService crmActivityService;

    @GetMapping
    public Page<CrmProductReviewResponse> getReviews(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) String product,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean hasText,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "ru") String lang,
            Pageable pageable
    ) {
        return productReviewService.getForCrm(
                status,
                product,
                rating,
                hasText,
                dateFrom,
                dateTo,
                Language.from(lang),
                PageableUtils.cap(pageable, CRM_PAGE_MAX_SIZE)
        );
    }

    @GetMapping("/pending-count")
    public Map<String, Long> getPendingCount() {
        return Map.of("count", productReviewService.pendingCount());
    }

    @PatchMapping("/{id}/approve")
    public CrmProductReviewResponse approve(
            @PathVariable Long id,
            @RequestParam(defaultValue = "ru") String lang,
            Authentication authentication,
            HttpServletRequest request
    ) {
        CrmProductReviewResponse response = productReviewService.approve(id, Language.from(lang), authentication);
        logModeration("PRODUCT_REVIEW_APPROVED", response, request);
        return response;
    }

    @PatchMapping("/{id}/reject")
    public CrmProductReviewResponse reject(
            @PathVariable Long id,
            @RequestParam(defaultValue = "ru") String lang,
            Authentication authentication,
            HttpServletRequest request
    ) {
        CrmProductReviewResponse response = productReviewService.reject(id, Language.from(lang), authentication);
        logModeration("PRODUCT_REVIEW_REJECTED", response, request);
        return response;
    }

    @DeleteMapping("/{id}")
    public CrmProductReviewResponse delete(
            @PathVariable Long id,
            @RequestParam(defaultValue = "ru") String lang,
            Authentication authentication,
            HttpServletRequest request
    ) {
        CrmProductReviewResponse response = productReviewService.delete(id, Language.from(lang), authentication);
        logModeration("PRODUCT_REVIEW_DELETED", response, request);
        return response;
    }

    private void logModeration(
            String eventType,
            CrmProductReviewResponse response,
            HttpServletRequest request
    ) {
        crmActivityService.log(
                eventType,
                "PRODUCT_REVIEW",
                response.id(),
                Map.of(
                        "productId", response.productId(),
                        "status", response.status()
                ),
                request
        );
    }
}
