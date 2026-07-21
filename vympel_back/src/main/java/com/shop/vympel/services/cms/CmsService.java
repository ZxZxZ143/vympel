package com.shop.vympel.services.cms;

import com.shop.vympel.dtos.cms.*;
import com.shop.vympel.enums.Language;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CmsService {
    List<CrmCmsPageSummaryResponse> getCrmPages();

    CrmCmsPageResponse getCrmPage(String pageKey);

    CrmCmsBlockResponse createBlock(CmsBlockRequest request);

    CrmCmsBlockResponse updateBlock(Long blockId, CmsBlockRequest request);

    CrmCmsBlockResponse deleteBlock(Long blockId);

    CrmCmsBlockResponse reorderBlock(Long blockId, CmsReorderRequest request);

    CrmCmsBlockResponse publishBlock(Long blockId);

    CrmCmsBlockResponse unpublishBlock(Long blockId);

    CmsMediaResponse uploadMedia(MultipartFile file) throws IOException;

    PublicCmsPageResponse getPublicPage(String pageKey, Language language);

    List<PublicCmsBlockResponse> getPublicBlocks(String pageKey, Language language);
}
