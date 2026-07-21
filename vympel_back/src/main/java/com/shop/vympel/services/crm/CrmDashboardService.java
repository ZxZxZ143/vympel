package com.shop.vympel.services.crm;

import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.dtos.crm.CrmDashboardResponse;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.product.ProductService;
import com.shop.vympel.services.review.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CrmDashboardService {
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final CrmActivityService crmActivityService;
    private final ProductReviewService productReviewService;

    @Transactional(readOnly = true)
    public CrmDashboardResponse getDashboard(Language language) {
        return new CrmDashboardResponse(
                productRepository.count(),
                productRepository.countByStatus("ACTIVE"),
                productRepository.countByStockQuantityGreaterThan(0),
                productRepository.countByStockQuantityLessThanEqual(0),
                productRepository.countMissingKaspiUrl(),
                productRepository.countMissingWildberriesUrl(),
                productReviewService.pendingCount(),
                productRepository.findTop5ByOrderByUpdatedAtDesc()
                        .stream()
                        .map(product -> productService.get(product.getId(), language))
                        .toList(),
                crmActivityService.getRecent(PageRequest.of(0, 8)).getContent()
        );
    }
}
