package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.entity.product.Media;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.media.MediaRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.enums.MediaType;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.s3.StorageProps;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ObjectStorageServiceTest {
    @Mock
    private S3Client s3;
    @Mock
    private MediaRepository mediaRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ImageVariantEncoder imageVariantEncoder;
    @Mock
    private ObjectStorageDeletionOutboxService objectStorageDeletionOutboxService;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;
    @Mock
    private MultipartFile file;
    @Mock
    private MultipartFile secondFile;

    private ObjectStorageService service;

    @BeforeEach
    void setUp() {
        service = new ObjectStorageService(
                s3,
                new StorageProps(
                        "products",
                        "us-east-1",
                        "http://storage-internal.test",
                        "http://storage-public.test/",
                        "access",
                        "secret",
                        true
                ),
                mediaRepository,
                objectStorageDeletionOutboxService,
                productRepository,
                imageVariantEncoder,
                eventPublisher
        );
    }

    @Test
    void publishesVariantFamilyBeforeOriginalAndKeepsOriginalBytes() throws Exception {
        Product product = product(10L);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of());
        mockImage(file, "watch.png", "image/png");
        byte[] original = file.getBytes();
        when(imageVariantEncoder.encode(any(byte[].class), any(String.class), org.mockito.ArgumentMatchers.eq(false), org.mockito.ArgumentMatchers.anyLong()))
                .thenReturn(Optional.of(new ImageVariantEncoder.Encoded(160, 240, java.util.Map.of(160, new byte[]{1, 2, 3}))));

        List<String> keys = service.uploadProductImage(List.of(file), 10L);
        var requests = ArgumentCaptor.forClass(PutObjectRequest.class);
        var bodies = ArgumentCaptor.forClass(RequestBody.class);
        verify(s3, times(2)).putObject(requests.capture(), bodies.capture());
        assertTrue(requests.getAllValues().get(0).key().endsWith("/w160.webp"));
        assertTrue(keys.get(0).endsWith("/160x240/original.png"));
        assertEquals(keys.get(0), requests.getAllValues().get(1).key());
        assertEquals(ResponsiveImageLayout.sha256(original), requests.getAllValues().get(1).metadata().get("sha256"));
        assertEquals("public, max-age=31536000, immutable", requests.getValue().cacheControl());
        org.junit.jupiter.api.Assertions.assertArrayEquals(original, bodies.getValue().contentStreamProvider().newStream().readAllBytes());
        assertTrue(requests.getValue().contentMD5() != null);
        assertEquals(List.of("*"), requests.getValue().overrideConfiguration().orElseThrow().headers().get("If-None-Match"));
    }

    @Test
    void partialVariantFailureNeverPersistsAReadyReference() throws Exception {
        Product product = product(10L);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of());
        mockImage(file, "watch.png", "image/png");
        when(imageVariantEncoder.encode(any(byte[].class), any(String.class), org.mockito.ArgumentMatchers.eq(false), org.mockito.ArgumentMatchers.anyLong()))
                .thenReturn(Optional.of(new ImageVariantEncoder.Encoded(160, 240, java.util.Map.of(160, new byte[]{1}))));
        when(s3.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(software.amazon.awssdk.services.s3.model.PutObjectResponse.builder().build())
                .thenThrow(new IllegalStateException("storage unavailable"));
        assertThrows(IllegalStateException.class, () -> service.uploadProductImage(List.of(file), 10L));
        verify(mediaRepository, never()).save(any(Media.class));
        verify(s3).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void uploadPersistsMultipleImagesInOrderAndMakesOnlyTheFirstMain() throws Exception {
        Product product = product(10L);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of());
        mockImage(file, "watch.jpg", "image/jpeg");
        mockImage(secondFile, "watch-side.png", "image/png");

        service.uploadProductImage(List.of(file, secondFile), 10L);

        ArgumentCaptor<Media> mediaCaptor = ArgumentCaptor.forClass(Media.class);
        verify(mediaRepository, times(2)).save(mediaCaptor.capture());
        Media first = mediaCaptor.getAllValues().get(0);
        Media second = mediaCaptor.getAllValues().get(1);
        assertEquals(0, first.getPosition());
        assertTrue(first.getMain());
        assertEquals(MediaType.IMAGE.getCode(), first.getType());
        assertTrue(first.getUrl().startsWith("product/"));
        assertEquals(1, second.getPosition());
        assertFalse(second.getMain());
        assertEquals(MediaType.IMAGE.getCode(), second.getType());
        assertTrue(second.getUrl().startsWith("product/"));
        verify(s3, times(2)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void reorderRequiresTheExactProductImageSet() {
        Product product = product(10L);
        Media first = image(1L, product, 0, true, "products/1.jpg");
        Media second = image(2L, product, 1, false, "products/2.jpg");
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of(first, second));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.reorderProductImages(10L, List.of(2L))
        );
    }

    @Test
    void productCardLinkPrefersTheMainImageOverTheFirstPosition() {
        Product product = product(10L);
        Media main = image(2L, product, 4, true, "product/main.jpg");
        when(mediaRepository.findFirstByProduct_IdAndTypeAndMainTrue(10L, MediaType.IMAGE.getCode()))
                .thenReturn(Optional.of(main));

        String link = service.getFirstLinkByProductId(10L);

        assertEquals("http://storage-public.test/products/product/main.jpg", link);
        verify(mediaRepository, never())
                .findFirstByProduct_IdAndTypeOrderByPositionAscIdAsc(10L, MediaType.IMAGE.getCode());
    }

    @Test
    void setMainMovesTheSelectedImageFirstAndMakesItTheOnlyMainImage() {
        Product product = product(10L);
        Media first = image(1L, product, 0, true, "products/1.jpg");
        Media second = image(2L, product, 1, false, "products/2.jpg");
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of(first, second));
        when(mediaRepository.findByProduct_IdAndTypeOrderByPositionAscIdAsc(10L, MediaType.IMAGE.getCode()))
                .thenReturn(List.of(first, second));

        service.setMainProductImage(10L, 2L);

        assertFalse(first.getMain());
        assertTrue(second.getMain());
        assertEquals(1, first.getPosition());
        assertEquals(0, second.getPosition());
        verify(mediaRepository, times(3)).saveAllAndFlush(anyList());
    }

    @Test
    void deleteMainImagePromotesTheNextOrderedImage() {
        Product product = product(10L);
        Media first = image(1L, product, 0, true, "products/1.jpg");
        Media second = image(2L, product, 4, false, "products/2.jpg");
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of(first, second));
        when(mediaRepository.findByProduct_IdAndTypeOrderByPositionAscIdAsc(10L, MediaType.IMAGE.getCode()))
                .thenReturn(List.of(second));

        service.deleteProductImage(10L, 1L);

        verify(objectStorageDeletionOutboxService).enqueue("products/1.jpg");
        verify(s3, never()).deleteObject(any(DeleteObjectRequest.class));
        verify(mediaRepository).delete(first);
        assertEquals(0, second.getPosition());
        assertTrue(second.getMain());
    }

    @Test
    void deletingProductQueuesEveryStoredImageBeforeDatabaseCascade() {
        Product product = product(10L);
        Media first = image(1L, product, 0, true, "products/first.jpg");
        Media second = image(2L, product, 1, false, "products/second.jpg");
        when(mediaRepository.findAllOwnedByProductIdForUpdate(10L)).thenReturn(List.of(first, second));

        service.enqueueProductImagesForDeletion(10L);

        verify(objectStorageDeletionOutboxService).enqueue("products/first.jpg");
        verify(objectStorageDeletionOutboxService).enqueue("products/second.jpg");
    }

    @Test
    void activeProductCannotDeleteItsFinalImage() {
        Product product = product(10L);
        product.setStatus("ACTIVE");
        Media image = image(1L, product, 0, true, "products/1.jpg");
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of(image));

        BusinessRuleViolationException exception = assertThrows(
                BusinessRuleViolationException.class,
                () -> service.deleteProductImage(10L, 1L)
        );

        assertEquals("PRODUCT_FINAL_IMAGE_DELETE_FORBIDDEN", exception.getCode());
        verify(s3, never()).deleteObject(any(DeleteObjectRequest.class));
        verify(objectStorageDeletionOutboxService, never()).enqueue(any());
        verify(mediaRepository, never()).delete(image);
    }

    @Test
    void reorderMakesTheFirstRequestedImageMainWithContiguousPositions() {
        Product product = product(10L);
        Media first = image(1L, product, 0, true, "products/1.jpg");
        Media second = image(2L, product, 1, false, "products/2.jpg");
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of(first, second));
        when(mediaRepository.findByProduct_IdAndTypeOrderByPositionAscIdAsc(10L, MediaType.IMAGE.getCode()))
                .thenReturn(List.of(second, first));

        service.reorderProductImages(10L, List.of(2L, 1L));

        assertEquals(0, second.getPosition());
        assertTrue(second.getMain());
        assertEquals(1, first.getPosition());
        assertFalse(first.getMain());
        verify(mediaRepository, times(3)).saveAllAndFlush(anyList());
    }

    @Test
    void cmsUploadRejectsSpoofedImageContentBeforeStorageWrite() throws Exception {
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getOriginalFilename()).thenReturn("banner.png");
        when(file.getSize()).thenReturn(4L);
        when(file.getBytes()).thenReturn(new byte[]{1, 2, 3, 4});

        assertThrows(IllegalArgumentException.class, () -> service.uploadCmsImage(file));

        verify(s3, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void cmsUploadAcceptsValidBoundedPngAndUsesCollisionResistantKey() throws Exception {
        byte[] png = imageBytes("png");
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getOriginalFilename()).thenReturn("banner.png");
        when(file.getSize()).thenReturn((long) png.length);
        when(file.getBytes()).thenReturn(png);

        var stored = service.uploadCmsImage(file);

        assertTrue(stored.objectKey().startsWith("cms/"));
        assertTrue(stored.objectKey().endsWith(".png"));
        verify(s3).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void productUploadRejectsSpoofedImageContentBeforeStorageWrite() throws Exception {
        Product product = product(10L);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getOriginalFilename()).thenReturn("watch.jpg");
        when(file.getSize()).thenReturn(4L);
        when(file.getBytes()).thenReturn(new byte[]{1, 2, 3, 4});

        assertThrows(IllegalArgumentException.class,
                () -> service.uploadProductImage(List.of(file), 10L));

        verify(s3, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void webpUploadIsRejectedUntilARealBoundedDecoderIsAvailable() throws Exception {
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/webp");

        assertThrows(IllegalArgumentException.class, () -> service.uploadCmsImage(file));

        verify(s3, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void eligibleUploadThatKeptOnlyItsOriginalIsQueuedForDeferredConversion() throws Exception {
        Product product = product(10L);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of());
        when(mediaRepository.save(any(Media.class))).thenAnswer(invocation -> {
            Media media = invocation.getArgument(0);
            media.setId(77L);
            return media;
        });
        mockImage(file, "watch.png", "image/png");
        when(imageVariantEncoder.encode(any(byte[].class), any(String.class), org.mockito.ArgumentMatchers.eq(false),
                org.mockito.ArgumentMatchers.anyLong())).thenReturn(Optional.empty());
        when(imageVariantEncoder.ineligibilityReason(any(byte[].class), any(String.class))).thenReturn(Optional.empty());

        List<String> keys = service.uploadProductImage(List.of(file), 10L);

        var event = ArgumentCaptor.forClass(ResponsiveMediaPendingEvent.class);
        verify(eventPublisher).publishEvent(event.capture());
        assertEquals(ResponsiveMediaArea.PRODUCT, event.getValue().area());
        assertEquals(List.of(new ResponsiveMediaPendingEvent.Item(77L, keys.get(0))), event.getValue().items());
    }

    @Test
    void ineligibleOriginalIsNotQueuedForDeferredConversion() throws Exception {
        Product product = product(10L);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(mediaRepository.findAllByProductIdForUpdate(10L)).thenReturn(List.of());
        when(mediaRepository.save(any(Media.class))).thenAnswer(invocation -> {
            Media media = invocation.getArgument(0);
            media.setId(78L);
            return media;
        });
        mockImage(file, "watch.png", "image/png");
        when(imageVariantEncoder.encode(any(byte[].class), any(String.class), org.mockito.ArgumentMatchers.eq(false),
                org.mockito.ArgumentMatchers.anyLong())).thenReturn(Optional.empty());
        when(imageVariantEncoder.ineligibilityReason(any(byte[].class), any(String.class)))
                .thenReturn(Optional.of("ANIMATED"));

        service.uploadProductImage(List.of(file), 10L);

        verify(eventPublisher, never()).publishEvent(any(Object.class));
    }

    @Test
    void legacyFamilyIsCreateOnlyWithDerivativesBeforeTheByteIdenticalOriginal() throws Exception {
        byte[] original = imageBytes("png");
        var legacy = ResponsiveImageLayout.legacy("product/12345678-1234-1234-1234-123456789012.png").orElseThrow();
        var encoded = new ImageVariantEncoder.Encoded(400, 600,
                java.util.Map.of(400, new byte[]{4}, 160, new byte[]{1}, 320, new byte[]{3}));

        String key = service.publishResponsiveFamily(legacy, original, encoded);

        String base = ResponsiveImageLayout.base("product", legacy.id(), original, 400, 600);
        assertEquals(base + "/original.png", key);
        var requests = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3, times(4)).putObject(requests.capture(), any(RequestBody.class));
        assertEquals(List.of(base + "/w160.webp", base + "/w320.webp", base + "/w400.webp", key),
                requests.getAllValues().stream().map(PutObjectRequest::key).toList());
        requests.getAllValues().forEach(request -> {
            assertEquals("*", request.overrideConfiguration().orElseThrow().headers().get("If-None-Match").get(0));
            assertEquals("public, max-age=31536000, immutable", request.cacheControl());
            assertEquals(ResponsiveImageLayout.sha256(original), request.metadata().get("source-sha256"));
        });
        assertEquals("image/png", requests.getAllValues().get(3).contentType());
        assertEquals(ResponsiveImageLayout.sha256(original), requests.getAllValues().get(3).metadata().get("sha256"));
        verify(s3, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void existingIdenticalFamilyObjectIsReusedButADifferentOneIsNeverReplaced() throws Exception {
        byte[] original = imageBytes("png");
        var legacy = ResponsiveImageLayout.legacy("cms/12345678-1234-1234-1234-123456789012.png").orElseThrow();
        byte[] variant = new byte[]{1, 2, 3};
        var encoded = new ImageVariantEncoder.Encoded(160, 90, java.util.Map.of(160, variant));
        var preconditionFailed = (software.amazon.awssdk.services.s3.model.S3Exception)
                software.amazon.awssdk.services.s3.model.S3Exception.builder().statusCode(412).message("exists").build();
        when(s3.putObject(any(PutObjectRequest.class), any(RequestBody.class))).thenThrow(preconditionFailed);
        when(s3.getObjectAsBytes(any(software.amazon.awssdk.services.s3.model.GetObjectRequest.class)))
                .thenReturn(software.amazon.awssdk.core.ResponseBytes.fromByteArray(
                        software.amazon.awssdk.services.s3.model.GetObjectResponse.builder().build(), variant))
                .thenReturn(software.amazon.awssdk.core.ResponseBytes.fromByteArray(
                        software.amazon.awssdk.services.s3.model.GetObjectResponse.builder().build(), new byte[]{9}));

        assertThrows(ResponsiveFamilyConflictException.class,
                () -> service.publishResponsiveFamily(legacy, original, encoded));

        // The identical derivative was reused; the differing original stopped publication.
        verify(s3, times(2)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        verify(s3, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    private Product product(Long id) {
        Product product = new Product();
        product.setId(id);
        return product;
    }

    private Media image(Long id, Product product, int position, boolean main, String key) {
        Media media = new Media();
        media.setId(id);
        media.setProduct(product);
        media.setPosition(position);
        media.setMain(main);
        media.setType(MediaType.IMAGE.getCode());
        media.setUrl(key);
        return media;
    }

    private void mockImage(MultipartFile image, String filename, String contentType) throws Exception {
        byte[] bytes = imageBytes("image/jpeg".equals(contentType) ? "jpeg" : "png");
        when(image.isEmpty()).thenReturn(false);
        when(image.getContentType()).thenReturn(contentType);
        when(image.getOriginalFilename()).thenReturn(filename);
        when(image.getSize()).thenReturn((long) bytes.length);
        when(image.getBytes()).thenReturn(bytes);
    }

    private byte[] imageBytes(String format) throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(image, format, output));
        return output.toByteArray();
    }
}
