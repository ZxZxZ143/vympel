package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.entity.product.Media;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.cms.CmsMediaReferenceProjection;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.media.MediaRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import com.shop.vympel.services.cms.CmsRevalidationOutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResponsiveMediaConversionServiceTest {
    private static final String UUID = "12345678-1234-1234-1234-123456789012";
    private static final String PRODUCT_KEY = "product/" + UUID + ".png";
    private static final String CMS_KEY = "cms/" + UUID + ".jpg";
    private static final String FAMILY_KEY = "product/responsive-v1/" + UUID + "/"
            + "a".repeat(64) + "/400x600/original.png";
    private static final byte[] ORIGINAL = {1, 2, 3, 4};

    @Mock
    private MediaRepository mediaRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CmsMediaRepository cmsMediaRepository;
    @Mock
    private ObjectStorageService objectStorageService;
    @Mock
    private ImageVariantEncoder imageVariantEncoder;
    @Mock
    private CmsRevalidationOutboxService revalidationOutboxService;

    private ResponsiveMediaConversionService service;

    @BeforeEach
    void setUp() {
        service = new ResponsiveMediaConversionService(mediaRepository, productRepository, cmsMediaRepository,
                objectStorageService, imageVariantEncoder, revalidationOutboxService);
    }

    @Test
    void productMediaGainsAFamilyAfterLockingItsProductAndOnlyItsKeyChanges() {
        Media media = productMedia(PRODUCT_KEY);
        var encoded = new ImageVariantEncoder.Encoded(400, 600, Map.of(160, new byte[]{1}, 400, new byte[]{1, 2}));
        when(objectStorageService.download(PRODUCT_KEY)).thenReturn(ORIGINAL);
        when(imageVariantEncoder.ineligibilityReason(ORIGINAL, "image/png")).thenReturn(Optional.empty());
        when(imageVariantEncoder.encode(eq(ORIGINAL), eq("image/png"), eq(false), anyLong()))
                .thenReturn(Optional.of(encoded));
        when(objectStorageService.publishResponsiveFamily(any(), eq(ORIGINAL), eq(encoded))).thenReturn(FAMILY_KEY);

        var result = service.convertProductMedia(5L, PRODUCT_KEY, false);

        assertEquals(ResponsiveMediaConversionStatus.CONVERTED, result.status());
        assertEquals(FAMILY_KEY, media.getUrl());
        assertEquals(2, result.variantCount());
        assertEquals(3L, result.variantBytes());
        assertEquals(4L, result.originalBytes());
        assertEquals(0, media.getPosition());
        assertEquals(Boolean.TRUE, media.getMain());
        verify(productRepository).findByIdForUpdate(10L);
        verify(objectStorageService).validateStoredImage(ORIGINAL, "image/png");
    }

    @Test
    void dryRunChecksTheOriginalWithoutEncodingOrWriting() {
        Media media = productMedia(PRODUCT_KEY);
        when(objectStorageService.download(PRODUCT_KEY)).thenReturn(ORIGINAL);
        when(imageVariantEncoder.ineligibilityReason(ORIGINAL, "image/png")).thenReturn(Optional.empty());

        var result = service.convertProductMedia(5L, PRODUCT_KEY, true);

        assertEquals(ResponsiveMediaConversionStatus.WOULD_CONVERT, result.status());
        assertEquals(PRODUCT_KEY, media.getUrl());
        verify(imageVariantEncoder, never()).encode(any(), anyString(), anyBoolean(), anyLong());
        verify(objectStorageService, never()).publishResponsiveFamily(any(), any(), any());
    }

    @Test
    void aChangedSharedOrUnsupportedKeyIsNeverDownloaded() {
        productMedia(PRODUCT_KEY);
        assertEquals(ResponsiveMediaConversionStatus.CHANGED,
                service.convertProductMedia(5L, "product/other.png", false).status());

        when(mediaRepository.isProductMediaKeyShared(5L, PRODUCT_KEY)).thenReturn(true);
        assertEquals(ResponsiveMediaConversionStatus.SHARED,
                service.convertProductMedia(5L, PRODUCT_KEY, false).status());

        Media gif = productMedia("product/" + UUID + ".gif");
        assertEquals(ResponsiveMediaConversionStatus.UNSUPPORTED_KEY,
                service.convertProductMedia(5L, gif.getUrl(), false).status());

        productMedia(FAMILY_KEY);
        assertEquals(ResponsiveMediaConversionStatus.ALREADY_RESPONSIVE,
                service.convertProductMedia(5L, FAMILY_KEY, false).status());

        Media cmsKeyOnProduct = productMedia(CMS_KEY);
        assertEquals(ResponsiveMediaConversionStatus.UNSUPPORTED_KEY,
                service.convertProductMedia(5L, cmsKeyOnProduct.getUrl(), false).status());
        verify(objectStorageService, never()).download(anyString());
    }

    @Test
    void deletedRowsMissingOriginalsIneligibleImagesAndBusyEncodersKeepTheReference() {
        when(mediaRepository.findProductIdByMediaId(6L)).thenReturn(Optional.empty());
        assertEquals(ResponsiveMediaConversionStatus.GONE, service.convertProductMedia(6L, PRODUCT_KEY, false).status());

        Media media = productMedia(PRODUCT_KEY);
        when(objectStorageService.download(PRODUCT_KEY))
                .thenThrow(NoSuchKeyException.builder().message("missing").build())
                .thenReturn(ORIGINAL);
        assertEquals(ResponsiveMediaConversionStatus.MISSING_ORIGINAL,
                service.convertProductMedia(5L, PRODUCT_KEY, false).status());

        when(imageVariantEncoder.ineligibilityReason(ORIGINAL, "image/png"))
                .thenReturn(Optional.of("ANIMATED"))
                .thenReturn(Optional.empty());
        var ineligible = service.convertProductMedia(5L, PRODUCT_KEY, false);
        assertEquals(ResponsiveMediaConversionStatus.NOT_ELIGIBLE, ineligible.status());
        assertEquals("ANIMATED", ineligible.reason());

        when(imageVariantEncoder.encode(eq(ORIGINAL), eq("image/png"), eq(false), anyLong())).thenReturn(Optional.empty());
        assertEquals(ResponsiveMediaConversionStatus.ENCODER_UNAVAILABLE,
                service.convertProductMedia(5L, PRODUCT_KEY, false).status());
        assertEquals(PRODUCT_KEY, media.getUrl());
        verify(objectStorageService, never()).publishResponsiveFamily(any(), any(), any());
    }

    @Test
    void cmsConversionRefreshesEveryReferencingAllowedPageInTheSameTransaction() {
        CmsMedia media = cmsMedia(CMS_KEY, CmsMediaLifecycleStatus.ACTIVE, null);
        String family = "cms/responsive-v1/" + UUID + "/" + "b".repeat(64) + "/1942x809/original.jpg";
        var encoded = new ImageVariantEncoder.Encoded(1942, 809, Map.of(160, new byte[]{1}));
        when(cmsMediaRepository.countReferences(7L)).thenReturn(3L);
        var references = List.of(reference("home"), reference("home"), reference("about"), reference("retired-page"));
        when(cmsMediaRepository.findReferences(7L, 200)).thenReturn(references);
        when(objectStorageService.download(CMS_KEY)).thenReturn(ORIGINAL);
        when(imageVariantEncoder.ineligibilityReason(ORIGINAL, "image/jpeg")).thenReturn(Optional.empty());
        when(imageVariantEncoder.encode(eq(ORIGINAL), eq("image/jpeg"), eq(true), anyLong()))
                .thenReturn(Optional.of(encoded));
        when(objectStorageService.publishResponsiveFamily(any(), eq(ORIGINAL), eq(encoded))).thenReturn(family);

        var result = service.convertCmsMedia(7L, CMS_KEY, false);

        assertEquals(ResponsiveMediaConversionStatus.CONVERTED, result.status());
        assertEquals(family, media.getObjectKey());
        verify(revalidationOutboxService).enqueue("about");
        verify(revalidationOutboxService).enqueue("home");
        verify(revalidationOutboxService, never()).enqueue("retired-page");
    }

    @Test
    void orphanedInactiveOrSharedCmsMediaIsLeftAlone() {
        cmsMedia(CMS_KEY, CmsMediaLifecycleStatus.ACTIVE, Instant.now());
        when(cmsMediaRepository.countReferences(7L)).thenReturn(0L);
        assertEquals(ResponsiveMediaConversionStatus.UNREFERENCED, service.convertCmsMedia(7L, CMS_KEY, false).status());

        cmsMedia(CMS_KEY, CmsMediaLifecycleStatus.DELETE_PENDING, null);
        assertEquals(ResponsiveMediaConversionStatus.INACTIVE, service.convertCmsMedia(7L, CMS_KEY, false).status());

        cmsMedia(CMS_KEY, CmsMediaLifecycleStatus.ACTIVE, null);
        when(cmsMediaRepository.isObjectKeyShared(7L, CMS_KEY)).thenReturn(true);
        assertEquals(ResponsiveMediaConversionStatus.SHARED, service.convertCmsMedia(7L, CMS_KEY, false).status());
        verify(objectStorageService, never()).download(anyString());
        verify(revalidationOutboxService, never()).enqueue(anyString());
    }

    private Media productMedia(String key) {
        Product product = new Product();
        product.setId(10L);
        Media media = new Media();
        media.setId(5L);
        media.setProduct(product);
        media.setUrl(key);
        media.setPosition(0);
        media.setMain(true);
        media.setType("IMAGE");
        when(mediaRepository.findProductIdByMediaId(5L)).thenReturn(Optional.of(10L));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of(media));
        return media;
    }

    private CmsMedia cmsMedia(String key, CmsMediaLifecycleStatus status, Instant orphanedAt) {
        CmsMedia media = new CmsMedia();
        media.setId(7L);
        media.setObjectKey(key);
        media.setLifecycleStatus(status);
        media.setOrphanedAt(orphanedAt);
        when(cmsMediaRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(media));
        return media;
    }

    private CmsMediaReferenceProjection reference(String pageKey) {
        var reference = mock(CmsMediaReferenceProjection.class);
        when(reference.getPageKey()).thenReturn(pageKey);
        return reference;
    }
}
