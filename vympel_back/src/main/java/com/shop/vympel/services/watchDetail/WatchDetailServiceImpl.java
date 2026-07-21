package com.shop.vympel.services.watchDetail;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.product.WatchDetail;
import com.shop.vympel.db.repositories.product.watchDetail.WatchDetailRepository;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailResponse;
import com.shop.vympel.dtos.product.details.WatchDetailUpdateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.mappers.product.WatchDetailMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WatchDetailServiceImpl implements WatchDetailService {
    private final WatchDetailRepository watchDetailRepository;
    private final WatchDetailMapper watchDetailMapper;

    @Override
    @Transactional()
    public WatchDetailResponse getWatchDetailById(Long id, Language  lang) {
        return watchDetailMapper
                .toResponse(
                        watchDetailRepository.findByProduct_Id(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Watch detail not found")),
                        lang
                );
    }

    @Override
    @Transactional()
    public WatchDetailResponse getWatchDetailByIdOrNull(Long id, Language  lang) {
        return watchDetailRepository.findByProduct_Id(id)
                .map(detail -> watchDetailMapper.toResponse(detail, lang))
                .orElse(null);
    }

    @Override
    @Transactional
    public WatchDetail create(WatchDetailCreateRequest watchDetailCreateRequest, Product product) {
        if (watchDetailCreateRequest == null) {
            throw new IllegalArgumentException("watchDetails is required for wristwatch categories");
        }
        WatchDetail watchDetail = watchDetailMapper.toEntity(watchDetailCreateRequest);
        watchDetail.setProduct(product);
        return watchDetailRepository.save(watchDetail);
    }

    @Override
    @Transactional
    public WatchDetail update(WatchDetailUpdateRequest watchDetailUpdateRequest, Product product) {
        WatchDetail watchDetail = watchDetailRepository.findByProduct_Id(product.getId())
                .orElseGet(() -> {
                    WatchDetail newDetail = new WatchDetail();
                    newDetail.setProduct(product);
                    return newDetail;
                });

        watchDetailMapper.updateEntity(watchDetail, watchDetailUpdateRequest);

        return watchDetailRepository.save(watchDetail);
    }
}
