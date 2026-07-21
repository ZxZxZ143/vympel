package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmActivityResponse;
import com.shop.vympel.services.crm.CrmActivityService;
import com.shop.vympel.utils.PageableUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crm/activity")
@RequiredArgsConstructor
public class CrmActivityController {
    private static final int CRM_PAGE_MAX_SIZE = 100;

    private final CrmActivityService crmActivityService;

    @GetMapping
    public Page<CrmActivityResponse> getActivity(Pageable pageable) {
        return crmActivityService.getRecent(PageableUtils.cap(pageable, CRM_PAGE_MAX_SIZE));
    }
}
