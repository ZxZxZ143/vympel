package com.shop.vympel.controllers;

import com.shop.vympel.dtos.crm.CrmDashboardResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.crm.CrmDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crm/dashboard")
@RequiredArgsConstructor
public class CrmDashboardController {
    private final CrmDashboardService crmDashboardService;

    @GetMapping
    public CrmDashboardResponse getDashboard(@RequestParam(defaultValue = "ru") String lang) {
        return crmDashboardService.getDashboard(Language.from(lang));
    }
}
