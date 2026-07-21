package com.shop.vympel.controllers;

import com.shop.vympel.dtos.category.CategoryResponse;
import com.shop.vympel.dtos.category.CategoryWithParentResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.category.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController()
@RequestMapping("/api/public/category")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping("/all/{lang}")
    public ResponseEntity<List<CategoryResponse>> getAll(@PathVariable Language lang) {
        return ResponseEntity.ok(categoryService.getAll(lang));
    }

    @GetMapping("/{lang}/{code}")
    public ResponseEntity<CategoryWithParentResponse> get(@PathVariable Language lang, @PathVariable String code) {
        return ResponseEntity.ok(categoryService.getByCategoryCodeWithParents(code, lang));
    }
}
