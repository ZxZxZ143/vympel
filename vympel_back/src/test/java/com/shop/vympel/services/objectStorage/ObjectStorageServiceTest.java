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
                productRepository
        );
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

        verify(s3).deleteObject(any(DeleteObjectRequest.class));
        verify(mediaRepository).delete(first);
        assertEquals(0, second.getPosition());
        assertTrue(second.getMain());
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
        byte[] png = new byte[24];
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(signature, 0, png, 0, signature.length);
        png[19] = 100;
        png[23] = 50;
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
        when(image.isEmpty()).thenReturn(false);
        when(image.getContentType()).thenReturn(contentType);
        when(image.getOriginalFilename()).thenReturn(filename);
        when(image.getSize()).thenReturn(4L);
        when(image.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3, 4}));
    }
}
