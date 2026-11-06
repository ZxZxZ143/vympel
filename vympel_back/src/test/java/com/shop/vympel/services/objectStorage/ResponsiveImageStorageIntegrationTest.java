package com.shop.vympel.services.objectStorage;

import com.shop.vympel.db.repositories.media.MediaRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.s3.StorageProps;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Uses the staging MinIO digest in an isolated, ephemeral bucket/container. */
@Testcontainers(disabledWithoutDocker = true)
class ResponsiveImageStorageIntegrationTest {
    @Container
    private static final GenericContainer<?> MINIO = new GenericContainer<>(
            "ghcr.io/zxzxz143/vympel-minio@sha256:fef3b9cf8ce1bcb83cd30b9a41273c8585855c0a269fa97cf297c6615745b969")
            .withEnv("MINIO_ROOT_USER", "image-test")
            .withEnv("MINIO_ROOT_PASSWORD", "local-test-only-password")
            .withCommand("server", "/data").withExposedPorts(9000)
            .waitingFor(Wait.forHttp("/minio/health/live").forPort(9000));

    @Test
    void checksumsConditionalWritesAndFamilyDeletionWorkAgainstMinio() throws Exception {
        String endpoint = "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000);
        try (var s3 = S3Client.builder().endpointOverride(URI.create(endpoint)).region(Region.US_EAST_1)
                .forcePathStyle(true).credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("image-test", "local-test-only-password"))).build()) {
            s3.createBucket(b -> b.bucket("image-validation"));
            var output = new ByteArrayOutputStream();
            ImageIO.write(new BufferedImage(40, 60, BufferedImage.TYPE_INT_ARGB), "png", output);
            byte[] original = output.toByteArray();
            byte[] derivative = new byte[]{1, 2, 3}; // Codec bytes are tested separately with real cwebp.
            var encoder = mock(ImageVariantEncoder.class);
            when(encoder.encode(any(), eq("image/png"), eq(true), anyLong())).thenReturn(Optional.of(
                    new ImageVariantEncoder.Encoded(40, 60, Map.of(40, derivative))));
            var service = new ObjectStorageService(s3,
                    new StorageProps("image-validation", "us-east-1", endpoint, endpoint,
                            "image-test", "local-test-only-password", true),
                    mock(MediaRepository.class), mock(ObjectStorageDeletionOutboxService.class),
                    mock(ProductRepository.class), encoder,
                    mock(org.springframework.context.ApplicationEventPublisher.class));
            String key = service.uploadCmsImage(new MockMultipartFile("image", "watch.png", "image/png", original)).objectKey();
            assertArrayEquals(original, service.download(key));
            var head = s3.headObject(b -> b.bucket("image-validation").key(key));
            assertEquals("image/png", head.contentType());
            assertEquals("public, max-age=31536000, immutable", head.cacheControl());
            assertEquals(ResponsiveImageLayout.sha256(original), head.metadata().get("sha256"));
            String variant = key.substring(0, key.lastIndexOf('/')) + "/w40.webp";
            assertArrayEquals(derivative, service.download(variant));
            var overwrite = PutObjectRequest.builder().bucket("image-validation").key(key)
                    .overrideConfiguration(c -> c.putHeader("If-None-Match", "*")).build();
            assertEquals(412, assertThrows(S3Exception.class,
                    () -> s3.putObject(overwrite, RequestBody.fromBytes(derivative))).statusCode());
            var corrupt = PutObjectRequest.builder().bucket("image-validation").key("must-not-exist.png")
                    .contentMD5("AAAAAAAAAAAAAAAAAAAAAA==").build();
            assertEquals("BadDigest", assertThrows(S3Exception.class,
                    () -> s3.putObject(corrupt, RequestBody.fromBytes(original))).awsErrorDetails().errorCode());
            service.delete(key);
            assertTrue(s3.listObjectsV2(b -> b.bucket("image-validation")).contents().isEmpty());
        }
    }
}
