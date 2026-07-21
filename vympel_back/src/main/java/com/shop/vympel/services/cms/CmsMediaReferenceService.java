package com.shop.vympel.services.cms;

import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.dtos.cms.CmsMediaReferenceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CmsMediaReferenceService {
    private static final int MAX_REFERENCE_DETAILS = 200;

    private final CmsMediaRepository cmsMediaRepository;

    @Transactional(readOnly = true)
    public long countReferences(Long mediaId) {
        return cmsMediaRepository.countReferences(mediaId);
    }

    @Transactional(readOnly = true)
    public boolean isReferenced(Long mediaId) {
        return countReferences(mediaId) > 0;
    }

    @Transactional(readOnly = true)
    public List<CmsMediaReferenceResponse> findReferences(Long mediaId) {
        return cmsMediaRepository.findReferences(mediaId, MAX_REFERENCE_DETAILS)
                .stream()
                .map(reference -> new CmsMediaReferenceResponse(
                        reference.getBlockId(),
                        reference.getBlockKey(),
                        reference.getPageKey(),
                        reference.getBlockStatus(),
                        reference.getSlot()
                ))
                .toList();
    }
}
