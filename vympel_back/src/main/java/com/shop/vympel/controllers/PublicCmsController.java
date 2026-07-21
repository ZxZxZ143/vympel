package com.shop.vympel.controllers;

import com.shop.vympel.dtos.cms.PublicCmsBlockResponse;
import com.shop.vympel.dtos.cms.PublicCmsPageResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.cms.CmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/cms")
@RequiredArgsConstructor
public class PublicCmsController {
    private final CmsService cmsService;

    @GetMapping("/pages/{pageKey}")
    public ResponseEntity<PublicCmsPageResponse> getPage(
            @PathVariable String pageKey,
            @RequestParam(defaultValue = "ru") String lang
    ) {
        return publicCmsResponse(cmsService.getPublicPage(pageKey, Language.from(lang)));
    }

    @GetMapping("/blocks/{pageKey}")
    public ResponseEntity<List<PublicCmsBlockResponse>> getBlocks(
            @PathVariable String pageKey,
            @RequestParam(defaultValue = "ru") String lang
    ) {
        return publicCmsResponse(cmsService.getPublicBlocks(pageKey, Language.from(lang)));
    }

    private <T> ResponseEntity<T> publicCmsResponse(T body) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=30, stale-while-revalidate=30")
                .body(body);
    }
}
