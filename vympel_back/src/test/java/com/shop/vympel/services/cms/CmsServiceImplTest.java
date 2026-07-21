package com.shop.vympel.services.cms;

import com.shop.vympel.db.entity.cms.CmsBlock;
import com.shop.vympel.db.entity.cms.CmsBlockTranslation;
import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.entity.cms.CmsPage;
import com.shop.vympel.db.repositories.cms.CmsBlockRepository;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.cms.CmsPageRepository;
import com.shop.vympel.dtos.cms.CmsBlockRequest;
import com.shop.vympel.dtos.cms.CmsReorderRequest;
import com.shop.vympel.dtos.cms.CmsTranslationRequest;
import com.shop.vympel.enums.CmsBlockStatus;
import com.shop.vympel.enums.CmsBlockType;
import com.shop.vympel.enums.CmsLinkOpenBehavior;
import com.shop.vympel.enums.CmsLinkType;
import com.shop.vympel.enums.CmsMediaStorageType;
import com.shop.vympel.enums.CmsPageStatus;
import com.shop.vympel.enums.Language;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CmsServiceImplTest {
    @Mock
    private CmsPageRepository cmsPageRepository;
    @Mock
    private CmsBlockRepository cmsBlockRepository;
    @Mock
    private CmsMediaRepository cmsMediaRepository;
    @Mock
    private ObjectStorageService objectStorageService;
    @Mock
    private CmsRevalidationOutboxService revalidationOutboxService;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @InjectMocks
    private CmsServiceImpl cmsService;

    @Test
    void publicPageReturnsPublishedVariantsAndFallsBackEmptyTranslationFieldsToRussian() {
        CmsPage page = new CmsPage();
        page.setPageKey("home");
        page.setTitle("Home");
        page.setStatus(CmsPageStatus.ACTIVE);

        CmsBlock block = new CmsBlock();
        block.setId(1L);
        block.setPage(page);
        block.setBlockKey("home.heroSlider.slide1");
        block.setBlockType(CmsBlockType.HERO_SLIDER);
        block.setSortOrder(10);
        block.setStatus(CmsBlockStatus.PUBLISHED);
        block.setMedia(publicMedia(1L, "/default.png"));
        block.setMediaKz(publicMedia(2L, "/kz.png"));
        block.setMediaEn(publicMedia(3L, "/en.png"));
        block.setMobileMedia(publicMedia(4L, "/mobile.png"));
        block.setMobileMediaKz(publicMedia(5L, "/mobile-kz.png"));
        block.setMobileMediaEn(publicMedia(6L, "/mobile-en.png"));

        CmsBlockTranslation russian = translation(block, "ru", "Русский заголовок");
        CmsBlockTranslation english = translation(block, "en", null);
        block.setTranslations(List.of(russian, english));

        when(cmsPageRepository.findByPageKeyAndStatus("home", CmsPageStatus.ACTIVE))
                .thenReturn(Optional.of(page));
        when(cmsBlockRepository.findByPage_PageKeyAndStatusOrderBySortOrderAscIdAsc(
                "home",
                CmsBlockStatus.PUBLISHED
        )).thenReturn(List.of(block));

        var response = cmsService.getPublicPage("home", Language.EN);
        var publicBlock = response.blocks().get(0);

        assertEquals("/default.png", publicBlock.media().url());
        assertEquals("/kz.png", publicBlock.mediaKz().url());
        assertEquals("/en.png", publicBlock.mediaEn().url());
        assertEquals("/mobile.png", publicBlock.mobileMedia().url());
        assertEquals("/mobile-kz.png", publicBlock.mobileMediaKz().url());
        assertEquals("/mobile-en.png", publicBlock.mobileMediaEn().url());
        assertEquals("Русский заголовок", publicBlock.translation().title());
        assertEquals("en", publicBlock.translation().lang());
    }

    @Test
    void updateBlockMergesTranslationsByLanguageAndCanSaveSameVariantPayloadTwice() {
        CmsPage page = page("home");
        CmsMedia defaultMedia = publicMedia(1L, "/default.png");
        CmsMedia kzMedia = publicMedia(2L, "/kz.png");
        CmsMedia enMedia = publicMedia(3L, "/en.png");
        CmsMedia mobileMedia = publicMedia(4L, "/mobile.png");
        CmsMedia mobileKzMedia = publicMedia(5L, "/mobile-kz.png");
        CmsMedia mobileEnMedia = publicMedia(6L, "/mobile-en.png");

        CmsBlock block = new CmsBlock();
        block.setId(3L);
        block.setPage(page);
        block.setBlockKey("home.hero");
        block.setBlockType(CmsBlockType.BANNER);
        block.setSortOrder(10);
        block.setStatus(CmsBlockStatus.PUBLISHED);
        block.setMedia(defaultMedia);

        CmsBlockTranslation russian = translation(block, "ru", null);
        russian.setId(10L);
        russian.setAltText("old ru alt");
        CmsBlockTranslation kazakh = translation(block, "kk", null);
        kazakh.setId(11L);
        kazakh.setAltText("old kz alt");
        CmsBlockTranslation english = translation(block, "en", null);
        english.setId(12L);
        english.setAltText("old en alt");
        block.setTranslations(new ArrayList<>(List.of(russian, kazakh, english)));

        CmsBlockRequest request = bannerRequest(Map.of(
                "ru", altTranslation("new ru alt"),
                "kz", altTranslation("new kz alt"),
                "en", altTranslation("new en alt")
        ));

        stubLockedPageBlocks(page, List.of(block), 3L);
        when(cmsBlockRepository.existsByBlockKeyAndIdNot("home.hero", 3L)).thenReturn(false);
        when(cmsMediaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(defaultMedia));
        when(cmsMediaRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(kzMedia));
        when(cmsMediaRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(enMedia));
        when(cmsMediaRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(mobileMedia));
        when(cmsMediaRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(mobileKzMedia));
        when(cmsMediaRepository.findByIdForUpdate(6L)).thenReturn(Optional.of(mobileEnMedia));

        cmsService.updateBlock(3L, request);
        cmsService.updateBlock(3L, request);

        assertEquals(3, block.getTranslations().size());
        assertSame(russian, translationByLang(block, "ru"));
        assertSame(kazakh, translationByLang(block, "kk"));
        assertSame(english, translationByLang(block, "en"));
        assertEquals("new ru alt", russian.getAltText());
        assertEquals("new kz alt", kazakh.getAltText());
        assertEquals("new en alt", english.getAltText());
        assertSame(defaultMedia, block.getMedia());
        assertSame(kzMedia, block.getMediaKz());
        assertSame(enMedia, block.getMediaEn());
        assertSame(mobileMedia, block.getMobileMedia());
        assertSame(mobileKzMedia, block.getMobileMediaKz());
        assertSame(mobileEnMedia, block.getMobileMediaEn());
    }

    @Test
    void updateBlockRejectsDuplicateTranslationLanguageAliases() {
        CmsPage page = page("home");
        CmsBlock block = new CmsBlock();
        block.setId(3L);
        block.setPage(page);
        block.setBlockKey("home.text");
        block.setBlockType(CmsBlockType.TEXT_BLOCK);
        block.setTranslations(new ArrayList<>(List.of(translation(block, "ru", "Existing"))));

        Map<String, CmsTranslationRequest> translations = new LinkedHashMap<>();
        translations.put("kz", new CmsTranslationRequest("Kazakh", null, null, null, null, null));
        translations.put("kk", new CmsTranslationRequest("Duplicate Kazakh", null, null, null, null, null));

        CmsBlockRequest request = new CmsBlockRequest(
                "home",
                "home.text",
                CmsBlockType.TEXT_BLOCK,
                10,
                CmsBlockStatus.PUBLISHED,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                CmsLinkType.NONE,
                null,
                CmsLinkOpenBehavior.SAME_TAB,
                translations
        );

        block.setSortOrder(10);
        stubLockedPageBlocks(page, List.of(block), 3L);
        when(cmsBlockRepository.existsByBlockKeyAndIdNot("home.text", 3L)).thenReturn(false);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> cmsService.updateBlock(3L, request)
        );
        assertEquals("CMS translations must include each language only once", exception.getMessage());
    }

    @Test
    void reorderSerializesAndNormalizesTheWholePageToTenStepPositions() {
        CmsPage page = page("about");
        CmsBlock first = block(1L, page, "about.hero", 10);
        CmsBlock second = block(2L, page, "about.intro", 20);
        CmsBlock third = block(3L, page, "about.cooperation", 30);
        stubLockedPageBlocks(page, new ArrayList<>(List.of(first, second, third)), 1L);

        cmsService.reorderBlock(1L, new CmsReorderRequest(30));

        assertEquals(10, second.getSortOrder());
        assertEquals(20, third.getSortOrder());
        assertEquals(30, first.getSortOrder());
    }

    private CmsMedia publicMedia(Long id, String url) {
        CmsMedia media = new CmsMedia();
        media.setId(id);
        media.setStorageType(CmsMediaStorageType.PUBLIC_PATH);
        media.setPublicUrl(url);
        media.setSizeBytes(0L);
        return media;
    }

    private CmsPage page(String pageKey) {
        CmsPage page = new CmsPage();
        page.setId(2L);
        page.setPageKey(pageKey);
        page.setTitle(pageKey);
        page.setStatus(CmsPageStatus.ACTIVE);
        return page;
    }

    private CmsBlock block(Long id, CmsPage page, String blockKey, int sortOrder) {
        CmsBlock block = new CmsBlock();
        block.setId(id);
        block.setPage(page);
        block.setBlockKey(blockKey);
        block.setBlockType(CmsBlockType.BANNER);
        block.setSortOrder(sortOrder);
        block.setStatus(CmsBlockStatus.PUBLISHED);
        block.setTranslations(new ArrayList<>());
        return block;
    }

    private void stubLockedPageBlocks(CmsPage page, List<CmsBlock> blocks, Long blockId) {
        when(cmsBlockRepository.findPageIdByBlockId(blockId)).thenReturn(Optional.of(page.getId()));
        when(cmsPageRepository.findByIdForUpdate(page.getId())).thenReturn(Optional.of(page));
        when(cmsBlockRepository.findAllByPageIdForUpdate(page.getId())).thenReturn(blocks);
    }

    private CmsBlockRequest bannerRequest(Map<String, CmsTranslationRequest> translations) {
        return new CmsBlockRequest(
                "home",
                "home.hero",
                CmsBlockType.BANNER,
                10,
                CmsBlockStatus.PUBLISHED,
                null,
                1L,
                2L,
                3L,
                4L,
                5L,
                6L,
                CmsLinkType.NONE,
                null,
                CmsLinkOpenBehavior.SAME_TAB,
                translations
        );
    }

    private CmsTranslationRequest altTranslation(String altText) {
        return new CmsTranslationRequest(null, null, null, null, altText, null);
    }

    private CmsBlockTranslation translationByLang(CmsBlock block, String lang) {
        return block.getTranslations()
                .stream()
                .filter(translation -> lang.equals(translation.getLang()))
                .findFirst()
                .orElseThrow();
    }

    private CmsBlockTranslation translation(CmsBlock block, String lang, String title) {
        CmsBlockTranslation translation = new CmsBlockTranslation();
        translation.setBlock(block);
        translation.setLang(lang);
        translation.setTitle(title);
        return translation;
    }
}
