package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsBlock;
import com.shop.vympel.db.entity.cms.CmsBlockTranslation;
import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.entity.cms.CmsPage;
import com.shop.vympel.db.repositories.cms.CmsBlockRepository;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.cms.CmsPageRepository;
import com.shop.vympel.dtos.cms.*;
import com.shop.vympel.enums.*;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CmsServiceImpl implements CmsService {
    private static final List<String> SUPPORTED_DB_LANGS = List.of("ru", "en", "kk");
    private static final String FALLBACK_DB_LANG = "ru";
    private static final CmsTranslationRequest EMPTY_TRANSLATION =
            new CmsTranslationRequest(null, null, null, null, null, null);

    private final CmsPageRepository cmsPageRepository;
    private final CmsBlockRepository cmsBlockRepository;
    private final CmsMediaRepository cmsMediaRepository;
    private final ObjectStorageService objectStorageService;
    private final CmsRevalidationOutboxService revalidationOutboxService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<CrmCmsPageSummaryResponse> getCrmPages() {
        return cmsPageRepository.findAllByOrderByPageKeyAsc()
                .stream()
                .map(page -> new CrmCmsPageSummaryResponse(
                        page.getId(),
                        page.getPageKey(),
                        page.getTitle(),
                        page.getStatus(),
                        page.getBlocks().size()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CrmCmsPageResponse getCrmPage(String pageKey) {
        CmsPage page = findPage(pageKey);
        return toCrmPageResponse(page);
    }

    @Override
    @Transactional
    public CrmCmsBlockResponse createBlock(CmsBlockRequest request) {
        String blockKey = cleanRequired(request.blockKey(), "Block key is required");
        CmsPage page = lockPageByKey(request.pageKey());
        if (cmsBlockRepository.existsByBlockKey(blockKey)) {
            throw new IllegalArgumentException("CMS block key already exists");
        }

        List<CmsBlock> blocks = cmsBlockRepository.findAllByPageIdForUpdate(page.getId());
        CmsBlock block = new CmsBlock();
        applyRequest(block, request, page);
        int requestedSortOrder = requestedSortOrder(request.sortOrder());
        block.setSortOrder(nextTemporarySortOrder(blocks));
        CmsBlock saved = cmsBlockRepository.saveAndFlush(block);
        blocks.add(saved);
        normalizeBlockOrder(blocks, saved, null, requestedSortOrder);
        revalidationOutboxService.enqueue(saved.getPage().getPageKey());
        return toCrmBlockResponse(saved);
    }

    @Override
    @Transactional
    public CrmCmsBlockResponse updateBlock(Long blockId, CmsBlockRequest request) {
        LockedPageBlocks locked = lockPageBlocks(blockId);
        CmsBlock block = locked.block(blockId);
        String requestedPageKey = cleanRequired(request.pageKey(), "Page key is required");
        if (!locked.page().getPageKey().equals(requestedPageKey)) {
            throw new IllegalArgumentException("Changing a CMS block page is not supported");
        }
        String blockKey = cleanRequired(request.blockKey(), "Block key is required");
        if (cmsBlockRepository.existsByBlockKeyAndIdNot(blockKey, blockId)) {
            throw new IllegalArgumentException("CMS block key already exists");
        }

        Set<Long> previousMediaIds = mediaIds(block);
        int currentSortOrder = block.getSortOrder();
        int requestedSortOrder = request.sortOrder() == null ? currentSortOrder : request.sortOrder();
        applyRequest(block, request, locked.page());
        normalizeBlockOrder(locked.blocks(), block, currentSortOrder, requestedSortOrder);
        publishDetachedMedia(previousMediaIds, mediaIds(block));
        revalidationOutboxService.enqueue(block.getPage().getPageKey());
        return toCrmBlockResponse(block);
    }

    @Override
    @Transactional
    public CrmCmsBlockResponse deleteBlock(Long blockId) {
        LockedPageBlocks locked = lockPageBlocks(blockId);
        CmsBlock block = locked.block(blockId);
        CrmCmsBlockResponse response = toCrmBlockResponse(block);
        Set<Long> previousMediaIds = mediaIds(block);
        cmsBlockRepository.delete(block);
        cmsBlockRepository.flush();
        List<CmsBlock> remaining = locked.blocks().stream()
                .filter(candidate -> !candidate.getId().equals(blockId))
                .toList();
        persistCanonicalBlockOrder(remaining);
        eventPublisher.publishEvent(new CmsMediaReferencesChangedEvent(previousMediaIds));
        revalidationOutboxService.enqueue(block.getPage().getPageKey());
        return response;
    }

    @Override
    @Transactional
    public CrmCmsBlockResponse reorderBlock(Long blockId, CmsReorderRequest request) {
        LockedPageBlocks locked = lockPageBlocks(blockId);
        CmsBlock block = locked.block(blockId);
        int currentSortOrder = block.getSortOrder();
        normalizeBlockOrder(locked.blocks(), block, currentSortOrder, request.sortOrder());
        revalidationOutboxService.enqueue(block.getPage().getPageKey());
        return toCrmBlockResponse(block);
    }

    @Override
    @Transactional
    public CrmCmsBlockResponse publishBlock(Long blockId) {
        LockedPageBlocks locked = lockPageBlocks(blockId);
        CmsBlock block = locked.block(blockId);
        block.setStatus(CmsBlockStatus.PUBLISHED);
        revalidationOutboxService.enqueue(block.getPage().getPageKey());
        return toCrmBlockResponse(block);
    }

    @Override
    @Transactional
    public CrmCmsBlockResponse unpublishBlock(Long blockId) {
        LockedPageBlocks locked = lockPageBlocks(blockId);
        CmsBlock block = locked.block(blockId);
        block.setStatus(CmsBlockStatus.DRAFT);
        revalidationOutboxService.enqueue(block.getPage().getPageKey());
        return toCrmBlockResponse(block);
    }

    @Override
    @Transactional
    public CmsMediaResponse uploadMedia(MultipartFile file) throws IOException {
        ObjectStorageService.StoredObject storedObject = objectStorageService.uploadCmsImage(file);

        CmsMedia media = new CmsMedia();
        media.setStorageType(CmsMediaStorageType.OBJECT_STORAGE);
        media.setObjectKey(storedObject.objectKey());
        media.setOriginalFilename(storedObject.originalFilename());
        media.setContentType(storedObject.contentType());
        media.setSizeBytes(storedObject.sizeBytes());

        try {
            return toMediaResponse(cmsMediaRepository.save(media));
        } catch (RuntimeException ex) {
            try {
                objectStorageService.delete(storedObject.objectKey());
            } catch (RuntimeException cleanupError) {
                ex.addSuppressed(cleanupError);
            }
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PublicCmsPageResponse getPublicPage(String pageKey, Language language) {
        return cmsPageRepository.findByPageKeyAndStatus(cleanRequired(pageKey, "Page key is required"), CmsPageStatus.ACTIVE)
                .map(page -> {
                    List<PublicCmsBlockResponse> blocks = toPublicBlocks(
                            cmsBlockRepository.findByPage_PageKeyAndStatusOrderBySortOrderAscIdAsc(
                                    page.getPageKey(),
                                    CmsBlockStatus.PUBLISHED
                            ),
                            language
                    );
                    return new PublicCmsPageResponse(
                            page.getPageKey(),
                            page.getTitle(),
                            blocks,
                            publicPageUpdatedAt(page, blocks)
                    );
                })
                .orElseGet(() -> new PublicCmsPageResponse(pageKey, null, List.of(), null));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicCmsBlockResponse> getPublicBlocks(String pageKey, Language language) {
        return cmsPageRepository.findByPageKeyAndStatus(cleanRequired(pageKey, "Page key is required"), CmsPageStatus.ACTIVE)
                .map(page -> toPublicBlocks(
                        cmsBlockRepository.findByPage_PageKeyAndStatusOrderBySortOrderAscIdAsc(
                                page.getPageKey(),
                                CmsBlockStatus.PUBLISHED
                        ),
                        language
                ))
                .orElse(List.of());
    }

    private void applyRequest(CmsBlock block, CmsBlockRequest request, CmsPage page) {
        CmsBlockType blockType = Objects.requireNonNull(request.blockType(), "Block type is required");
        CmsBlockSchema schema = CmsBlockSchema.forType(blockType);
        CmsLinkType linkType = schema.supportsLink() && request.linkType() != null
                ? request.linkType()
                : CmsLinkType.NONE;
        CmsLinkOpenBehavior linkOpenBehavior = request.linkOpenBehavior() == null
                ? CmsLinkOpenBehavior.SAME_TAB
                : request.linkOpenBehavior();
        String linkTarget = cleanOptional(request.linkTarget());
        Map<String, CmsTranslationRequest> translations = normalizeTranslations(request.translations());

        validateLink(linkType, linkTarget);
        validateTranslations(block, schema, translations, request.mediaId());

        block.setPage(page);
        block.setBlockKey(cleanRequired(request.blockKey(), "Block key is required"));
        block.setBlockType(blockType);
        block.setStatus(request.status() == null ? CmsBlockStatus.PUBLISHED : request.status());
        block.setSettingsJson(schema.supportsSettings() ? cleanOptional(request.settingsJson()) : null);
        block.setMedia(schema.supportsImage() ? findMedia(request.mediaId()) : null);
        block.setMediaKz(schema.supportsLocalizedImages() ? findMedia(request.mediaKzId()) : null);
        block.setMediaEn(schema.supportsLocalizedImages() ? findMedia(request.mediaEnId()) : null);
        block.setMobileMedia(schema.supportsMobileImage() ? findMedia(request.mobileMediaId()) : null);
        block.setMobileMediaKz(
                schema.supportsMobileImage() && schema.supportsLocalizedImages()
                        ? findMedia(request.mobileMediaKzId())
                        : null
        );
        block.setMobileMediaEn(
                schema.supportsMobileImage() && schema.supportsLocalizedImages()
                        ? findMedia(request.mobileMediaEnId())
                        : null
        );
        block.setLinkType(linkType);
        block.setLinkTarget(linkType == CmsLinkType.NONE ? null : linkTarget);
        block.setLinkOpenBehavior(linkOpenBehavior);

        mergeTranslations(block, schema, translations);
    }

    private void validateTranslations(
            CmsBlock block,
            CmsBlockSchema schema,
            Map<String, CmsTranslationRequest> translations,
            Long mediaId
    ) {
        if (schema.requiresImage() && mediaId == null) {
            throw new IllegalArgumentException("CMS media is required for this block type");
        }
        CmsTranslationRequest fallbackTranslation = effectiveTranslationForLang(block, translations, FALLBACK_DB_LANG);
        if (schema.requiresText()
                && isBlank(fallbackTranslation.title())
                && isBlank(fallbackTranslation.description())) {
            throw new IllegalArgumentException("CMS text blocks require a Russian title or description");
        }
    }

    private Map<String, CmsTranslationRequest> normalizeTranslations(
            Map<String, CmsTranslationRequest> translations
    ) {
        if (translations == null || translations.isEmpty()) {
            return Map.of();
        }

        Map<String, CmsTranslationRequest> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, CmsTranslationRequest> entry : translations.entrySet()) {
            String dbLang = normalizeTranslationLang(entry.getKey());
            if (normalized.putIfAbsent(dbLang, entry.getValue() == null ? EMPTY_TRANSLATION : entry.getValue()) != null) {
                throw new IllegalArgumentException("CMS translations must include each language only once");
            }
        }
        return normalized;
    }

    private void mergeTranslations(
            CmsBlock block,
            CmsBlockSchema schema,
            Map<String, CmsTranslationRequest> translations
    ) {
        Map<String, CmsBlockTranslation> existingByLang = new LinkedHashMap<>();
        Iterator<CmsBlockTranslation> iterator = block.getTranslations().iterator();
        while (iterator.hasNext()) {
            CmsBlockTranslation existing = iterator.next();
            String dbLang = normalizeTranslationLang(existing.getLang());
            existing.setLang(dbLang);
            existing.setBlock(block);
            if (existingByLang.containsKey(dbLang)) {
                iterator.remove();
            } else {
                existingByLang.put(dbLang, existing);
            }
        }

        for (CmsBlockTranslation existing : existingByLang.values()) {
            if (!translations.containsKey(existing.getLang())) {
                clearUnsupportedTranslationFields(existing, schema);
            }
        }

        for (Map.Entry<String, CmsTranslationRequest> entry : translations.entrySet()) {
            String dbLang = entry.getKey();
            CmsBlockTranslation translation = existingByLang.get(dbLang);
            if (translation == null) {
                translation = new CmsBlockTranslation();
                translation.setBlock(block);
                translation.setLang(dbLang);
                block.getTranslations().add(translation);
                existingByLang.put(dbLang, translation);
            }
            applyTranslation(translation, schema, entry.getValue());
        }
    }

    private void applyTranslation(
            CmsBlockTranslation translation,
            CmsBlockSchema schema,
            CmsTranslationRequest request
    ) {
        CmsTranslationRequest safeRequest = request == null ? EMPTY_TRANSLATION : request;
        translation.setTitle(schema.supportsText() ? cleanOptional(safeRequest.title()) : null);
        translation.setSubtitle(schema.supportsText() ? cleanOptional(safeRequest.subtitle()) : null);
        translation.setDescription(schema.supportsText() ? cleanOptional(safeRequest.description()) : null);
        translation.setButtonText(schema.supportsButton() ? cleanOptional(safeRequest.buttonText()) : null);
        translation.setAltText(schema.supportsAltText() ? cleanOptional(safeRequest.altText()) : null);
        translation.setExtraJson(schema.supportsExtraJson() ? cleanOptional(safeRequest.extraJson()) : null);
    }

    private void clearUnsupportedTranslationFields(CmsBlockTranslation translation, CmsBlockSchema schema) {
        if (!schema.supportsText()) {
            translation.setTitle(null);
            translation.setSubtitle(null);
            translation.setDescription(null);
        }
        if (!schema.supportsButton()) {
            translation.setButtonText(null);
        }
        if (!schema.supportsAltText()) {
            translation.setAltText(null);
        }
        if (!schema.supportsExtraJson()) {
            translation.setExtraJson(null);
        }
    }

    private CmsTranslationRequest effectiveTranslationForLang(
            CmsBlock block,
            Map<String, CmsTranslationRequest> translations,
            String dbLang
    ) {
        CmsTranslationRequest submitted = translations.get(dbLang);
        if (submitted != null) {
            return submitted;
        }
        return block.getTranslations()
                .stream()
                .filter(translation -> dbLang.equals(normalizeTranslationLang(translation.getLang())))
                .findFirst()
                .map(this::toTranslationRequest)
                .orElse(EMPTY_TRANSLATION);
    }

    private CmsTranslationRequest toTranslationRequest(CmsBlockTranslation translation) {
        return new CmsTranslationRequest(
                translation.getTitle(),
                translation.getSubtitle(),
                translation.getDescription(),
                translation.getButtonText(),
                translation.getAltText(),
                translation.getExtraJson()
        );
    }

    private String normalizeTranslationLang(String lang) {
        String cleaned = cleanRequired(lang, "CMS translation language is required").toLowerCase(Locale.ROOT);
        String dbLang = "kz".equals(cleaned) ? "kk" : cleaned;
        if (!SUPPORTED_DB_LANGS.contains(dbLang)) {
            throw new IllegalArgumentException("Unsupported CMS translation language");
        }
        return dbLang;
    }

    private void validateLink(CmsLinkType linkType, String linkTarget) {
        if (linkType == CmsLinkType.NONE) {
            return;
        }
        if (isBlank(linkTarget)) {
            throw new IllegalArgumentException("CMS link target is required");
        }
        if (linkType == CmsLinkType.EXTERNAL_URL) {
            try {
                URI uri = new URI(linkTarget);
                String scheme = uri.getScheme();
                if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                    throw new IllegalArgumentException("External CMS links must use http or https");
                }
            } catch (URISyntaxException ex) {
                throw new IllegalArgumentException("External CMS link is invalid");
            }
            return;
        }
        if (linkType == CmsLinkType.INTERNAL_ROUTE && (!linkTarget.startsWith("/") || linkTarget.startsWith("//"))) {
            throw new IllegalArgumentException("Internal CMS links must be site routes");
        }
        if (linkTarget.toLowerCase(Locale.ROOT).startsWith("javascript:")) {
            throw new IllegalArgumentException("CMS link target is invalid");
        }
    }

    private CrmCmsPageResponse toCrmPageResponse(CmsPage page) {
        List<CrmCmsBlockResponse> blocks = page.getBlocks()
                .stream()
                .sorted(Comparator.comparing(CmsBlock::getSortOrder).thenComparing(CmsBlock::getId))
                .map(this::toCrmBlockResponse)
                .toList();

        return new CrmCmsPageResponse(
                page.getId(),
                page.getPageKey(),
                page.getTitle(),
                page.getStatus(),
                blocks
        );
    }

    private CrmCmsBlockResponse toCrmBlockResponse(CmsBlock block) {
        Map<String, CmsBlockTranslation> translationsByLang = block.getTranslations()
                .stream()
                .collect(Collectors.toMap(CmsBlockTranslation::getLang, Function.identity(), (left, right) -> left));
        Map<String, CmsTranslationResponse> translations = new LinkedHashMap<>();

        for (String lang : SUPPORTED_DB_LANGS) {
            translations.put(frontendLang(lang), toTranslationResponse(
                    Optional.ofNullable(translationsByLang.get(lang))
                            .orElseGet(() -> emptyTranslation(lang))
            ));
        }

        return new CrmCmsBlockResponse(
                block.getId(),
                block.getPage().getPageKey(),
                block.getBlockKey(),
                block.getBlockType(),
                block.getSortOrder(),
                block.getStatus(),
                block.getSettingsJson(),
                toMediaResponse(block.getMedia()),
                toMediaResponse(block.getMediaKz()),
                toMediaResponse(block.getMediaEn()),
                toMediaResponse(block.getMobileMedia()),
                toMediaResponse(block.getMobileMediaKz()),
                toMediaResponse(block.getMobileMediaEn()),
                block.getLinkType(),
                block.getLinkTarget(),
                block.getLinkOpenBehavior(),
                translations,
                block.getCreatedAt(),
                block.getUpdatedAt(),
                null
        );
    }

    private List<PublicCmsBlockResponse> toPublicBlocks(List<CmsBlock> blocks, Language language) {
        Language safeLanguage = language == null ? Language.RU : language;

        return blocks.stream()
                .map(block -> {
                    return new PublicCmsBlockResponse(
                            block.getId(),
                            block.getPage().getPageKey(),
                            block.getBlockKey(),
                            block.getBlockType(),
                            block.getSortOrder(),
                            block.getSettingsJson(),
                            toMediaResponse(block.getMedia()),
                            toMediaResponse(block.getMediaKz()),
                            toMediaResponse(block.getMediaEn()),
                            toMediaResponse(block.getMobileMedia()),
                            toMediaResponse(block.getMobileMediaKz()),
                            toMediaResponse(block.getMobileMediaEn()),
                            block.getLinkType(),
                            block.getLinkTarget(),
                            block.getLinkOpenBehavior(),
                            publicTranslation(block, safeLanguage),
                            block.getUpdatedAt()
                    );
                })
                .toList();
    }

    private java.time.Instant publicPageUpdatedAt(CmsPage page, List<PublicCmsBlockResponse> blocks) {
        java.time.Instant updatedAt = page.getUpdatedAt();
        for (PublicCmsBlockResponse block : blocks) {
            if (block.updatedAt() != null && (updatedAt == null || block.updatedAt().isAfter(updatedAt))) {
                updatedAt = block.updatedAt();
            }
        }
        return updatedAt;
    }

    private CmsTranslationResponse publicTranslation(CmsBlock block, Language language) {
        String dbLang = language.getValue();
        Map<String, CmsBlockTranslation> translationsByLang = block.getTranslations()
                .stream()
                .collect(Collectors.toMap(CmsBlockTranslation::getLang, Function.identity(), (left, right) -> left));
        CmsBlockTranslation current = translationsByLang.get(dbLang);
        CmsBlockTranslation fallback = Optional.ofNullable(translationsByLang.get(FALLBACK_DB_LANG))
                .or(() -> translationsByLang.values().stream().findFirst())
                .orElseGet(() -> emptyTranslation(FALLBACK_DB_LANG));

        return new CmsTranslationResponse(
                frontendLang(dbLang),
                firstNonBlank(current == null ? null : current.getTitle(), fallback.getTitle()),
                firstNonBlank(current == null ? null : current.getSubtitle(), fallback.getSubtitle()),
                firstNonBlank(current == null ? null : current.getDescription(), fallback.getDescription()),
                firstNonBlank(current == null ? null : current.getButtonText(), fallback.getButtonText()),
                firstNonBlank(current == null ? null : current.getAltText(), fallback.getAltText()),
                firstNonBlank(current == null ? null : current.getExtraJson(), fallback.getExtraJson())
        );
    }

    private CmsTranslationResponse toTranslationResponse(CmsBlockTranslation translation) {
        return new CmsTranslationResponse(
                frontendLang(translation.getLang()),
                translation.getTitle(),
                translation.getSubtitle(),
                translation.getDescription(),
                translation.getButtonText(),
                translation.getAltText(),
                translation.getExtraJson()
        );
    }

    private CmsMediaResponse toMediaResponse(CmsMedia media) {
        if (media == null) {
            return null;
        }

        String url = media.getStorageType() == CmsMediaStorageType.OBJECT_STORAGE
                ? objectStorageService.getPublicLink(media.getObjectKey())
                : media.getPublicUrl();

        return new CmsMediaResponse(
                media.getId(),
                media.getStorageType(),
                media.getPublicUrl(),
                url,
                media.getOriginalFilename(),
                media.getContentType(),
                media.getSizeBytes(),
                media.getCreatedAt()
        );
    }

    private LockedPageBlocks lockPageBlocks(Long blockId) {
        Long pageId = cmsBlockRepository.findPageIdByBlockId(blockId)
                .orElseThrow(() -> new ResourceNotFoundException("CMS block not found"));
        CmsPage page = cmsPageRepository.findByIdForUpdate(pageId)
                .orElseThrow(() -> new ResourceNotFoundException("CMS page not found"));
        List<CmsBlock> blocks = cmsBlockRepository.findAllByPageIdForUpdate(pageId);
        if (blocks.stream().noneMatch(block -> block.getId().equals(blockId))) {
            throw new ResourceNotFoundException("CMS block not found");
        }
        return new LockedPageBlocks(page, blocks);
    }

    private CmsPage lockPageByKey(String pageKey) {
        return cmsPageRepository.findByPageKeyForUpdate(cleanRequired(pageKey, "Page key is required"))
                .orElseThrow(() -> new ResourceNotFoundException("CMS page not found"));
    }

    private int requestedSortOrder(Integer sortOrder) {
        return sortOrder == null ? 0 : sortOrder;
    }

    private int nextTemporarySortOrder(List<CmsBlock> blocks) {
        int maximumSortOrder = blocks.stream()
                .map(CmsBlock::getSortOrder)
                .max(Integer::compareTo)
                .orElse(0);
        long candidate = (long) maximumSortOrder + ((long) blocks.size() + 2L) * 10L;
        if (candidate > Integer.MAX_VALUE) {
            throw cmsOrderConflict();
        }
        return (int) candidate;
    }

    private void normalizeBlockOrder(
            List<CmsBlock> blocks,
            CmsBlock target,
            Integer currentSortOrder,
            int requestedSortOrder
    ) {
        List<CmsBlock> originalOrder = blocks.stream()
                .sorted(Comparator.comparing(CmsBlock::getSortOrder).thenComparing(CmsBlock::getId))
                .collect(Collectors.toCollection(ArrayList::new));
        int originalIndex = originalOrder.indexOf(target);
        List<CmsBlock> ordered = originalOrder.stream()
                .filter(block -> block != target)
                .collect(Collectors.toCollection(ArrayList::new));

        int insertionIndex;
        if (currentSortOrder == null || requestedSortOrder > currentSortOrder) {
            insertionIndex = 0;
            while (insertionIndex < ordered.size()
                    && ordered.get(insertionIndex).getSortOrder() <= requestedSortOrder) {
                insertionIndex++;
            }
        } else if (requestedSortOrder < currentSortOrder) {
            insertionIndex = 0;
            while (insertionIndex < ordered.size()
                    && ordered.get(insertionIndex).getSortOrder() < requestedSortOrder) {
                insertionIndex++;
            }
        } else {
            insertionIndex = Math.min(Math.max(originalIndex, 0), ordered.size());
        }

        ordered.add(insertionIndex, target);
        persistCanonicalBlockOrder(ordered);
    }

    private void persistCanonicalBlockOrder(List<CmsBlock> ordered) {
        if (ordered.isEmpty()) {
            return;
        }

        int maximumSortOrder = ordered.stream()
                .map(CmsBlock::getSortOrder)
                .max(Integer::compareTo)
                .orElse(0);
        long temporaryBase = (long) maximumSortOrder + ((long) ordered.size() + 1L) * 10L;
        if (temporaryBase + ordered.size() > Integer.MAX_VALUE) {
            throw cmsOrderConflict();
        }

        for (int index = 0; index < ordered.size(); index++) {
            ordered.get(index).setSortOrder((int) temporaryBase + index);
        }
        cmsBlockRepository.saveAllAndFlush(ordered);

        for (int index = 0; index < ordered.size(); index++) {
            ordered.get(index).setSortOrder((index + 1) * 10);
        }
        cmsBlockRepository.saveAllAndFlush(ordered);
    }

    private BusinessRuleViolationException cmsOrderConflict() {
        return new BusinessRuleViolationException(
                "CMS_BLOCK_ORDER_CONFLICT",
                "CMS blocks could not be reordered safely."
        );
    }

    private record LockedPageBlocks(CmsPage page, List<CmsBlock> blocks) {
        private CmsBlock block(Long blockId) {
            return blocks.stream()
                    .filter(candidate -> candidate.getId().equals(blockId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("CMS block not found"));
        }
    }

    private CmsBlockTranslation emptyTranslation(String lang) {
        CmsBlockTranslation translation = new CmsBlockTranslation();
        translation.setLang(lang);
        return translation;
    }

    private CmsPage findPage(String pageKey) {
        return cmsPageRepository.findByPageKey(cleanRequired(pageKey, "Page key is required"))
                .orElseThrow(() -> new ResourceNotFoundException("CMS page not found"));
    }

    private CmsMedia findMedia(Long mediaId) {
        if (mediaId == null) {
            return null;
        }
        CmsMedia media = cmsMediaRepository.findByIdForUpdate(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("CMS media not found"));
        if (media.getLifecycleStatus() == CmsMediaLifecycleStatus.DELETE_PENDING) {
            throw new IllegalArgumentException("CMS media is currently pending deletion");
        }
        media.setLifecycleStatus(CmsMediaLifecycleStatus.ACTIVE);
        media.setOrphanedAt(null);
        media.setDeleteRequestedAt(null);
        media.setNextDeleteAttemptAt(null);
        media.setLastDeleteErrorCode(null);
        return media;
    }

    private Set<Long> mediaIds(CmsBlock block) {
        return java.util.stream.Stream.of(
                        block.getMedia(),
                        block.getMediaKz(),
                        block.getMediaEn(),
                        block.getMobileMedia(),
                        block.getMobileMediaKz(),
                        block.getMobileMediaEn()
                )
                .filter(Objects::nonNull)
                .map(CmsMedia::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private void publishDetachedMedia(Set<Long> previousMediaIds, Set<Long> currentMediaIds) {
        Set<Long> detached = new LinkedHashSet<>(previousMediaIds);
        detached.removeAll(currentMediaIds);
        if (!detached.isEmpty()) {
            eventPublisher.publishEvent(new CmsMediaReferencesChangedEvent(Set.copyOf(detached)));
        }
    }

    private String cleanRequired(String value, String error) {
        String cleaned = cleanOptional(value);
        if (cleaned == null) {
            throw new IllegalArgumentException(error);
        }
        return cleaned;
    }

    private String cleanOptional(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String firstNonBlank(String value, String fallback) {
        return isBlank(value) ? cleanOptional(fallback) : value.trim();
    }

    private String frontendLang(String dbLang) {
        return "kk".equals(dbLang) ? "kz" : dbLang;
    }
}
