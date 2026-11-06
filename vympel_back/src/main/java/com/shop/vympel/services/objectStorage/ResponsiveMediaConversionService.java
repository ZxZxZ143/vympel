package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.entity.cms.CmsMedia;
import com.shop.vympel.db.entity.product.Media;
import com.shop.vympel.db.repositories.cms.CmsMediaReferenceProjection;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.media.MediaRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.enums.CmsMediaLifecycleStatus;
import com.shop.vympel.enums.CmsMediaStorageType;
import com.shop.vympel.services.cms.CmsRevalidationOutboxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.util.Objects;
import java.util.Optional;
import java.util.TreeSet;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Converts one legacy media row per transaction. The owning rows are locked before the original is
 * read, so a concurrent CRM edit, deletion, cleanup claim or second worker serializes behind this
 * conversion and then observes the committed reference. Only {@code media.url} or
 * {@code cms_media.object_key} changes; ids, order, main flags and every original byte are preserved.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ResponsiveMediaConversionService {
    static final long ENCODING_BUDGET_NANOS = TimeUnit.SECONDS.toNanos(20);
    private static final int MAX_REFERENCES = 200;

    private final MediaRepository mediaRepository;
    private final ProductRepository productRepository;
    private final CmsMediaRepository cmsMediaRepository;
    private final ObjectStorageService objectStorageService;
    private final ImageVariantEncoder imageVariantEncoder;
    private final CmsRevalidationOutboxService revalidationOutboxService;

    /**
     * @param expectedKey the key observed at selection time; a different current key is reported as
     *                    {@link ResponsiveMediaConversionStatus#CHANGED} and nothing is written
     */
    @Transactional
    public ResponsiveMediaConversionResult convertProductMedia(Long mediaId, String expectedKey, boolean dryRun) {
        var area = ResponsiveMediaArea.PRODUCT;
        Optional<Long> productId = mediaRepository.findProductIdByMediaId(mediaId);
        if (productId.isEmpty() || productRepository.findByIdForUpdate(productId.get()).isEmpty()) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.GONE);
        }
        Media media = mediaRepository.findAllByProductIdForUpdate(productId.get()).stream()
                .filter(candidate -> mediaId.equals(candidate.getId()))
                .findFirst()
                .orElse(null);
        if (media == null) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.GONE);
        }
        String key = media.getUrl();
        var precheck = precheck(area, mediaId, key, expectedKey);
        if (precheck.result() != null) return precheck.result();
        if (mediaRepository.isProductMediaKeyShared(mediaId, key)) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.SHARED);
        }
        return convert(area, mediaId, key, precheck.legacy(), dryRun, media::setUrl);
    }

    @Transactional
    public ResponsiveMediaConversionResult convertCmsMedia(Long mediaId, String expectedKey, boolean dryRun) {
        var area = ResponsiveMediaArea.CMS;
        CmsMedia media = cmsMediaRepository.findByIdForUpdate(mediaId).orElse(null);
        if (media == null) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.GONE);
        }
        if (media.getStorageType() != CmsMediaStorageType.OBJECT_STORAGE
                || media.getLifecycleStatus() != CmsMediaLifecycleStatus.ACTIVE) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.INACTIVE);
        }
        String key = media.getObjectKey();
        var precheck = precheck(area, mediaId, key, expectedKey);
        if (precheck.result() != null) return precheck.result();
        long references = cmsMediaRepository.countReferences(mediaId);
        if (references == 0 && media.getOrphanedAt() != null) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.UNREFERENCED);
        }
        if (cmsMediaRepository.isObjectKeyShared(mediaId, key)) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.SHARED);
        }
        var result = convert(area, mediaId, key, precheck.legacy(), dryRun, media::setObjectKey);
        if (result.status() == ResponsiveMediaConversionStatus.CONVERTED && references > 0) {
            refreshReferencingPages(mediaId);
        }
        return result;
    }

    private Precheck precheck(ResponsiveMediaArea area, Long mediaId, String key, String expectedKey) {
        if (expectedKey != null && !expectedKey.equals(key)) {
            return Precheck.done(ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.CHANGED));
        }
        if (ResponsiveImageLayout.isFamily(key)) {
            return Precheck.done(ResponsiveMediaConversionResult.of(
                    area, mediaId, ResponsiveMediaConversionStatus.ALREADY_RESPONSIVE));
        }
        var legacy = ResponsiveImageLayout.legacy(key)
                .filter(candidate -> area.prefix().equals(candidate.area()));
        return legacy.map(Precheck::eligible).orElseGet(() -> Precheck.done(
                ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.UNSUPPORTED_KEY)));
    }

    private ResponsiveMediaConversionResult convert(ResponsiveMediaArea area, Long mediaId, String key,
                                                    ResponsiveImageLayout.LegacyKey legacy, boolean dryRun,
                                                    Consumer<String> applyKey) {
        byte[] bytes;
        try {
            bytes = objectStorageService.download(key);
        } catch (NoSuchKeyException exception) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.MISSING_ORIGINAL);
        }
        try {
            objectStorageService.validateStoredImage(bytes, legacy.contentType());
        } catch (IllegalArgumentException exception) {
            return ResponsiveMediaConversionResult.of(area, mediaId, ResponsiveMediaConversionStatus.INVALID_ORIGINAL,
                    exception.getMessage());
        }
        Optional<String> ineligible = imageVariantEncoder.ineligibilityReason(bytes, legacy.contentType());
        if (ineligible.isPresent()) {
            return new ResponsiveMediaConversionResult(area, mediaId, ResponsiveMediaConversionStatus.NOT_ELIGIBLE,
                    ineligible.get(), (long) bytes.length, null, null);
        }
        if (dryRun) {
            return new ResponsiveMediaConversionResult(area, mediaId, ResponsiveMediaConversionStatus.WOULD_CONVERT,
                    null, (long) bytes.length, null, null);
        }
        var encoded = imageVariantEncoder.encode(bytes, legacy.contentType(), area == ResponsiveMediaArea.CMS,
                System.nanoTime() + ENCODING_BUDGET_NANOS);
        if (encoded.isEmpty()) {
            return new ResponsiveMediaConversionResult(area, mediaId,
                    ResponsiveMediaConversionStatus.ENCODER_UNAVAILABLE, null, (long) bytes.length, null, null);
        }
        // A conflict propagates so the transaction rolls back and removes only objects created here.
        String familyKey = objectStorageService.publishResponsiveFamily(legacy, bytes, encoded.get());
        applyKey.accept(familyKey);
        long variantBytes = encoded.get().variants().values().stream().mapToLong(variant -> variant.length).sum();
        log.info("Responsive media converted area={} mediaId={} variants={} originalBytes={} variantBytes={}",
                area, mediaId, encoded.get().variants().size(), bytes.length, variantBytes);
        return new ResponsiveMediaConversionResult(area, mediaId, ResponsiveMediaConversionStatus.CONVERTED, null,
                (long) bytes.length, encoded.get().variants().size(), variantBytes);
    }

    private void refreshReferencingPages(Long mediaId) {
        var pageKeys = new TreeSet<String>();
        for (CmsMediaReferenceProjection reference : cmsMediaRepository.findReferences(mediaId, MAX_REFERENCES)) {
            String pageKey = reference.getPageKey();
            if (CmsRevalidationOutboxService.ALLOWED_PAGE_KEYS.contains(pageKey)) pageKeys.add(pageKey);
        }
        // Same transaction as the key change; delivery happens after commit through the signed outbox.
        pageKeys.stream().filter(Objects::nonNull).forEach(revalidationOutboxService::enqueue);
    }

    private record Precheck(ResponsiveImageLayout.LegacyKey legacy, ResponsiveMediaConversionResult result) {
        static Precheck eligible(ResponsiveImageLayout.LegacyKey legacy) {
            return new Precheck(legacy, null);
        }

        static Precheck done(ResponsiveMediaConversionResult result) {
            return new Precheck(null, result);
        }
    }
}
