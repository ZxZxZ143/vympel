package com.shop.vympel.utils;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PageableUtils {
    private PageableUtils() {
    }

    public static Pageable cap(Pageable pageable, int maxSize) {
        return cap(pageable, maxSize, Sort.unsorted());
    }

    public static Pageable cap(Pageable pageable, int maxSize, Sort fallbackSort) {
        int safeMaxSize = Math.max(1, maxSize);
        if (pageable == null || pageable.isUnpaged()) {
            return PageRequest.of(0, safeMaxSize, fallbackSort);
        }

        int pageNumber = Math.max(pageable.getPageNumber(), 0);
        int pageSize = Math.max(1, Math.min(pageable.getPageSize(), safeMaxSize));
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : fallbackSort;

        return PageRequest.of(pageNumber, pageSize, sort);
    }
}
