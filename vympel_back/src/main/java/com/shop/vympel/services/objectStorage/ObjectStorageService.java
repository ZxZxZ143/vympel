package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.entity.product.Media;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.media.MediaRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.dtos.product.image.ProductImageResponse;
import com.shop.vympel.enums.MediaType;
import com.shop.vympel.enums.ObjectStoragePath;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.s3.StorageProps;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ObjectStorageService {

    private final S3Client s3;
    private final StorageProps props;
    private final MediaRepository mediaRepository;
    private final ProductRepository productRepository;
    private static final Map<String, Set<String>> SUPPORTED_IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", Set.of("jpg", "jpeg"),
            "image/png", Set.of("png"),
            "image/webp", Set.of("webp"),
            "image/gif", Set.of("gif")
    );
    private static final int MAX_FILES_PER_UPLOAD = 10;
    private static final long MAX_IMAGE_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final int MAX_ORIGINAL_FILENAME_LENGTH = 180;
    private static final int MAX_IMAGE_DIMENSION = 12_000;
    private static final long MAX_IMAGE_PIXELS = 40_000_000L;

    public record StoredObject(
            String objectKey,
            String originalFilename,
            String contentType,
            Long sizeBytes
    ) {
    }

    @Transactional(rollbackOn = Exception.class)
    public List<String> uploadProductImage(List<MultipartFile> files, Long productId) throws IllegalArgumentException, IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("No image files selected");
        }
        if (files.size() > MAX_FILES_PER_UPLOAD) {
            throw new IllegalArgumentException("Too many image files selected");
        }

        Product product = productRepository.findByIdForUpdate(productId).orElseThrow(
                () -> new ResourceNotFoundException("Product not found with id " + productId)
        );
        files.forEach(this::validateImage);

        List<String> keys = new ArrayList<>();
        List<String> uploadedKeys = new ArrayList<>();
        List<Media> existingImages = mediaRepository.findAllByProductIdForUpdate(productId);
        int pos = existingImages.stream()
                .map(Media::getPosition)
                .max(Integer::compareTo)
                .orElse(-1) + 1;
        boolean hasMainImage = existingImages.stream().anyMatch(media -> Boolean.TRUE.equals(media.getMain()));
        try {
            for (MultipartFile file : files) {
                String contentType = normalizedContentType(file);
                String originalName = safeName(file.getOriginalFilename());
                String extension = validatedExtension(file, contentType);
                String key = ObjectStoragePath.PRODUCT.getValue() + "/" + UUID.randomUUID() + "." + extension;
                PutObjectRequest uploadRequest = PutObjectRequest.builder()
                        .bucket(props.bucket())
                        .key(key)
                        .contentType(contentType)
                        .metadata(Map.of(
                                "originalName", originalName
                        ))
                        .build();

                s3.putObject(uploadRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                uploadedKeys.add(key);

                Media newMedia = new Media();
                newMedia.setProduct(product);
                newMedia.setPosition(pos++);
                newMedia.setMain(!hasMainImage);
                newMedia.setType(MediaType.IMAGE.getCode());
                newMedia.setUrl(key);
                mediaRepository.save(newMedia);
                hasMainImage = true;

                keys.add(key);
            }
        } catch (IOException | RuntimeException ex) {
            cleanupUploadedObjects(uploadedKeys);
            log.error(
                    "Product image upload failed productId={} uploadedBeforeFailure={}",
                    productId,
                    uploadedKeys.size(),
                    ex
            );
            throw ex;
        }

        log.info("Product images uploaded productId={} count={}", productId, keys.size());
        return keys;
    }

    public byte[] download(String key) {
        GetObjectRequest req = GetObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .build();

        try {
            return s3.getObjectAsBytes(req).asByteArray();
        } catch (RuntimeException ex) {
            log.error("Object storage download failed objectKey={}", key, ex);
            throw ex;
        }
    }

    public StoredObject uploadCmsImage(MultipartFile file) throws IOException {
        validateImage(file);

        String contentType = normalizedContentType(file);
        byte[] bytes = file.getBytes();
        validateCmsImageContent(bytes, contentType);
        String originalName = safeName(file.getOriginalFilename());
        String extension = validatedExtension(file, contentType);
        String key = ObjectStoragePath.CMS.getValue() + "/" + UUID.randomUUID() + "." + extension;
        PutObjectRequest uploadRequest = PutObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .contentType(contentType)
                .metadata(Map.of("originalName", originalName))
                .build();

        try {
            s3.putObject(uploadRequest, RequestBody.fromBytes(bytes));
        } catch (RuntimeException ex) {
            log.error(
                    "CMS image upload failed contentType={} sizeBytes={}",
                    contentType,
                    file.getSize(),
                    ex
            );
            throw ex;
        }

        log.info("CMS image uploaded objectKey={} sizeBytes={}", key, file.getSize());
        return new StoredObject(
                key,
                originalName,
                contentType,
                file.getSize()
        );
    }

    private void validateCmsImageContent(byte[] bytes, String contentType) {
        ImageDimensions dimensions = switch (contentType) {
            case "image/png" -> pngDimensions(bytes);
            case "image/gif" -> gifDimensions(bytes);
            case "image/jpeg" -> jpegDimensions(bytes);
            case "image/webp" -> webpDimensions(bytes);
            default -> null;
        };
        if (dimensions == null || dimensions.width() <= 0 || dimensions.height() <= 0) {
            throw new IllegalArgumentException("Image content does not match its declared type");
        }
        if (dimensions.width() > MAX_IMAGE_DIMENSION
                || dimensions.height() > MAX_IMAGE_DIMENSION
                || (long) dimensions.width() * dimensions.height() > MAX_IMAGE_PIXELS) {
            throw new IllegalArgumentException("Image dimensions are too large");
        }
    }

    private ImageDimensions pngDimensions(byte[] bytes) {
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        if (!startsWith(bytes, signature) || bytes.length < 24) return null;
        return new ImageDimensions(readIntBigEndian(bytes, 16), readIntBigEndian(bytes, 20));
    }

    private ImageDimensions gifDimensions(byte[] bytes) {
        if (bytes.length < 10
                || !(ascii(bytes, 0, 6).equals("GIF87a") || ascii(bytes, 0, 6).equals("GIF89a"))) {
            return null;
        }
        return new ImageDimensions(readUnsignedShortLittleEndian(bytes, 6), readUnsignedShortLittleEndian(bytes, 8));
    }

    private ImageDimensions jpegDimensions(byte[] bytes) {
        if (bytes.length < 4 || unsigned(bytes[0]) != 0xff || unsigned(bytes[1]) != 0xd8) return null;
        int offset = 2;
        while (offset + 8 < bytes.length) {
            if (unsigned(bytes[offset]) != 0xff) {
                offset++;
                continue;
            }
            int marker = unsigned(bytes[offset + 1]);
            offset += 2;
            if (marker == 0xd8 || marker == 0xd9) continue;
            if (offset + 2 > bytes.length) return null;
            int length = (unsigned(bytes[offset]) << 8) | unsigned(bytes[offset + 1]);
            if (length < 2 || offset + length > bytes.length) return null;
            if (isJpegStartOfFrame(marker) && length >= 7) {
                int height = (unsigned(bytes[offset + 3]) << 8) | unsigned(bytes[offset + 4]);
                int width = (unsigned(bytes[offset + 5]) << 8) | unsigned(bytes[offset + 6]);
                return new ImageDimensions(width, height);
            }
            offset += length;
        }
        return null;
    }

    private ImageDimensions webpDimensions(byte[] bytes) {
        if (bytes.length < 30 || !ascii(bytes, 0, 4).equals("RIFF") || !ascii(bytes, 8, 4).equals("WEBP")) {
            return null;
        }
        String chunk = ascii(bytes, 12, 4);
        if ("VP8X".equals(chunk)) {
            return new ImageDimensions(readUnsigned24LittleEndian(bytes, 24) + 1, readUnsigned24LittleEndian(bytes, 27) + 1);
        }
        if ("VP8 ".equals(chunk)
                && unsigned(bytes[23]) == 0x9d && unsigned(bytes[24]) == 0x01 && unsigned(bytes[25]) == 0x2a) {
            return new ImageDimensions(
                    readUnsignedShortLittleEndian(bytes, 26) & 0x3fff,
                    readUnsignedShortLittleEndian(bytes, 28) & 0x3fff
            );
        }
        if ("VP8L".equals(chunk) && unsigned(bytes[20]) == 0x2f) {
            int b1 = unsigned(bytes[21]);
            int b2 = unsigned(bytes[22]);
            int b3 = unsigned(bytes[23]);
            int b4 = unsigned(bytes[24]);
            int width = 1 + b1 + ((b2 & 0x3f) << 8);
            int height = 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10);
            return new ImageDimensions(width, height);
        }
        return null;
    }

    private boolean isJpegStartOfFrame(int marker) {
        return marker >= 0xc0 && marker <= 0xcf
                && marker != 0xc4 && marker != 0xc8 && marker != 0xcc;
    }

    private boolean startsWith(byte[] bytes, byte[] prefix) {
        if (bytes.length < prefix.length) return false;
        for (int index = 0; index < prefix.length; index++) {
            if (bytes[index] != prefix[index]) return false;
        }
        return true;
    }

    private String ascii(byte[] bytes, int offset, int length) {
        if (offset < 0 || length < 0 || offset + length > bytes.length) return "";
        return new String(bytes, offset, length, java.nio.charset.StandardCharsets.US_ASCII);
    }

    private int readIntBigEndian(byte[] bytes, int offset) {
        if (offset + 4 > bytes.length) return -1;
        return (unsigned(bytes[offset]) << 24)
                | (unsigned(bytes[offset + 1]) << 16)
                | (unsigned(bytes[offset + 2]) << 8)
                | unsigned(bytes[offset + 3]);
    }

    private int readUnsignedShortLittleEndian(byte[] bytes, int offset) {
        if (offset + 2 > bytes.length) return -1;
        return unsigned(bytes[offset]) | (unsigned(bytes[offset + 1]) << 8);
    }

    private int readUnsigned24LittleEndian(byte[] bytes, int offset) {
        if (offset + 3 > bytes.length) return -1;
        return unsigned(bytes[offset])
                | (unsigned(bytes[offset + 1]) << 8)
                | (unsigned(bytes[offset + 2]) << 16);
    }

    private int unsigned(byte value) {
        return value & 0xff;
    }

    private record ImageDimensions(int width, int height) {
    }

    public List<ProductImageResponse> getProductImages(Long productId) {
        return mediaRepository
                .findByProduct_IdAndTypeOrderByPositionAscIdAsc(productId, MediaType.IMAGE.getCode())
                .stream()
                .map(this::toProductImageResponse)
                .toList();
    }

    public List<String> getLinksByProductId(Long productId) {
        return getProductImages(productId)
                .stream()
                .map(ProductImageResponse::url)
                .toList();
    }

    public String getFirstLinkByProductId(Long productId) {
        return mediaRepository
                .findFirstByProduct_IdAndTypeAndMainTrue(productId, MediaType.IMAGE.getCode())
                .or(() -> mediaRepository.findFirstByProduct_IdAndTypeOrderByPositionAscIdAsc(
                        productId,
                        MediaType.IMAGE.getCode()
                ))
                .map(media -> getPublicLink(media.getUrl()))
                .orElse(null);
    }

    @Transactional
    public List<ProductImageResponse> reorderProductImages(Long productId, List<Long> orderedImageIds) {
        productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));

        if (orderedImageIds == null || orderedImageIds.isEmpty()) {
            throw new IllegalArgumentException("Image order is required");
        }
        if (new HashSet<>(orderedImageIds).size() != orderedImageIds.size()) {
            throw new IllegalArgumentException("Image order contains duplicate ids");
        }

        List<Media> images = mediaRepository.findAllByProductIdForUpdate(productId);
        Set<Long> existingIds = images.stream().map(Media::getId).collect(java.util.stream.Collectors.toSet());
        if (existingIds.size() != orderedImageIds.size() || !existingIds.equals(new HashSet<>(orderedImageIds))) {
            throw new IllegalArgumentException("Image order must contain every product image exactly once");
        }

        Map<Long, Media> imagesById = images.stream()
                .collect(java.util.stream.Collectors.toMap(Media::getId, media -> media));
        List<Media> orderedImages = orderedImageIds.stream()
                .map(imagesById::get)
                .toList();
        applyCanonicalProductImageOrder(orderedImages);

        return getProductImages(productId);
    }

    @Transactional
    public List<ProductImageResponse> setMainProductImage(Long productId, Long imageId) {
        productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        List<Media> images = mediaRepository.findAllByProductIdForUpdate(productId);
        Media target = images.stream()
                .filter(media -> media.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product image not found"));

        List<Media> orderedImages = new ArrayList<>();
        orderedImages.add(target);
        images.stream()
                .filter(media -> !media.getId().equals(imageId))
                .forEach(orderedImages::add);
        applyCanonicalProductImageOrder(orderedImages);

        return getProductImages(productId);
    }

    @Transactional(rollbackOn = Exception.class)
    public List<ProductImageResponse> deleteProductImage(Long productId, Long imageId) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        List<Media> images = mediaRepository.findAllByProductIdForUpdate(productId);
        Media target = images.stream()
                .filter(media -> media.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product image not found"));
        if ("ACTIVE".equals(product.getStatus()) && images.size() == 1) {
            throw new BusinessRuleViolationException(
                    "PRODUCT_FINAL_IMAGE_DELETE_FORBIDDEN",
                    "An active product must keep a main image. Change its status before deleting the final image."
            );
        }

        delete(target.getUrl());
        target.setMain(false);
        mediaRepository.saveAndFlush(target);
        mediaRepository.delete(target);
        mediaRepository.flush();

        List<Media> remaining = images.stream()
                .filter(media -> !media.getId().equals(imageId))
                .toList();
        applyCanonicalProductImageOrder(remaining);

        return getProductImages(productId);
    }

    public String getPublicLink(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }

        return publicEndpoint() +
                "/" +
                props.bucket() +
                "/" +
                key;
    }

    private String publicEndpoint() {
        String endpoint = props.publicEndpoint();
        while (endpoint.endsWith("/")) {
            endpoint = endpoint.substring(0, endpoint.length() - 1);
        }
        return endpoint;
    }

    private ProductImageResponse toProductImageResponse(Media media) {
        return new ProductImageResponse(
                media.getId(),
                getPublicLink(media.getUrl()),
                null,
                media.getPosition(),
                Boolean.TRUE.equals(media.getMain())
        );
    }

    public boolean hasRequiredMainProductImage(Long productId) {
        return mediaRepository.findFirstByProduct_IdAndTypeAndMainTrue(productId, MediaType.IMAGE.getCode())
                .filter(media -> Integer.valueOf(0).equals(media.getPosition()))
                .isPresent();
    }

    private void applyCanonicalProductImageOrder(List<Media> orderedImages) {
        if (orderedImages.isEmpty()) {
            return;
        }

        orderedImages.forEach(media -> media.setMain(false));
        mediaRepository.saveAllAndFlush(orderedImages);

        int maximumPosition = orderedImages.stream()
                .map(Media::getPosition)
                .max(Integer::compareTo)
                .orElse(0);
        long temporaryBase = (long) maximumPosition + orderedImages.size() + 1L;
        if (temporaryBase + orderedImages.size() > Integer.MAX_VALUE) {
            throw new BusinessRuleViolationException(
                    "PRODUCT_MEDIA_POSITION_CONFLICT",
                    "Product images could not be reordered safely."
            );
        }

        for (int index = 0; index < orderedImages.size(); index++) {
            orderedImages.get(index).setPosition((int) temporaryBase + index);
        }
        mediaRepository.saveAllAndFlush(orderedImages);

        for (int index = 0; index < orderedImages.size(); index++) {
            Media media = orderedImages.get(index);
            media.setPosition(index);
            media.setMain(index == 0);
        }
        mediaRepository.saveAllAndFlush(orderedImages);
    }

    public void delete(String key) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder()
                    .bucket(props.bucket())
                    .key(key)
                    .build());
        } catch (RuntimeException ex) {
            log.error("Object storage delete failed objectKey={}", key, ex);
            throw ex;
        }
    }

    private String safeName(String name) {
        if (name == null) return "file";
        String sanitized = name.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (sanitized.isBlank()) {
            return "file";
        }
        return sanitized.length() <= MAX_ORIGINAL_FILENAME_LENGTH
                ? sanitized
                : sanitized.substring(0, MAX_ORIGINAL_FILENAME_LENGTH);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is empty");
        }

        String normalizedContentType = normalizedContentType(file);

        if (!SUPPORTED_IMAGE_EXTENSIONS.containsKey(normalizedContentType)) {
            throw new IllegalArgumentException("Unsupported image file type");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image file is too large");
        }

        validatedExtension(file, normalizedContentType);
    }

    private String normalizedContentType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
    }

    private String validatedExtension(MultipartFile file, String normalizedContentType) {
        String extension = fileExtension(file.getOriginalFilename());
        Set<String> supportedExtensions = SUPPORTED_IMAGE_EXTENSIONS.get(normalizedContentType);
        if (extension == null || supportedExtensions == null || !supportedExtensions.contains(extension)) {
            throw new IllegalArgumentException("Unsupported image file extension");
        }

        return extension;
    }

    private String fileExtension(String name) {
        if (name == null) {
            return null;
        }

        String normalizedName = name.trim().toLowerCase(Locale.ROOT);
        int lastSlash = Math.max(normalizedName.lastIndexOf('/'), normalizedName.lastIndexOf('\\'));
        int lastDot = normalizedName.lastIndexOf('.');
        if (lastDot <= lastSlash || lastDot == normalizedName.length() - 1) {
            return null;
        }

        return normalizedName.substring(lastDot + 1);
    }

    private void cleanupUploadedObjects(List<String> uploadedKeys) {
        for (String key : uploadedKeys) {
            try {
                delete(key);
            } catch (RuntimeException cleanupError) {
                log.warn("Could not delete uploaded object after failed upload: {}", key, cleanupError);
            }
        }
    }
}
