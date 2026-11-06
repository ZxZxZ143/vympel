package com.shop.vympel.services.objectStorage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ImageVariantEncoderTest {
    @Test
    void layoutIsBoundedAndDeletionNeverExpandsLegacyKeys() {
        assertEquals(List.of(160, 320, 480, 800, 1086), ResponsiveImageLayout.widths(1086, false));
        assertEquals(List.of(80), ResponsiveImageLayout.widths(80, true));
        assertEquals(List.of("product/legacy.png"), ResponsiveImageLayout.ownedKeys("product/legacy.png"));
        String base = ResponsiveImageLayout.base("product", "12345678-1234-1234-1234-123456789012", new byte[]{1}, 480, 640);
        assertEquals(List.of(base + "/w160.webp", base + "/w320.webp", base + "/w480.webp", base + "/original.png"),
                ResponsiveImageLayout.ownedKeys(base + "/original.png"));
        assertEquals(64, ResponsiveImageLayout.sha256(new byte[]{1}).length());
        assertThrows(IllegalArgumentException.class, () -> ResponsiveImageLayout.base("private", "id", new byte[]{1}, 1, 1));
    }

    @Test
    void missingCodecDisabledEncodingAndAnimationKeepOriginals() throws Exception {
        byte[] image = image();
        assertTrue(new ImageVariantEncoder(false, "missing-codec").encode(image, "image/png", false).isEmpty());
        assertTrue(new ImageVariantEncoder(true, "missing-codec").encode(image, "image/png", false).isEmpty());
        assertTrue(new ImageVariantEncoder(true, "missing-codec").encode(image, "image/gif", false).isEmpty());
    }

    @Test
    void apngChunkIsPreservedWithoutEncoding() throws Exception {
        byte[] png = image();
        assertFalse(ImageVariantEncoder.hasAnimation(png));
        byte[] animated = new byte[png.length + 20];
        System.arraycopy(png, 0, animated, 0, 33); // signature + IHDR
        java.nio.ByteBuffer.wrap(animated, 33, 4).putInt(8);
        System.arraycopy(new byte[]{'a', 'c', 'T', 'L'}, 0, animated, 37, 4);
        System.arraycopy(png, 33, animated, 53, png.length - 33);
        assertTrue(ImageVariantEncoder.hasAnimation(animated));
        assertTrue(new ImageVariantEncoder(true, "missing-codec").encode(animated, "image/png", false).isEmpty());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "VYMPEL_IMAGE_VARIANTS_EXECUTABLE", matches = ".+")
    void realCodecProducesDeterministicWebpWithoutUpscaling() throws Exception {
        var encoder = new ImageVariantEncoder(true, System.getenv("VYMPEL_IMAGE_VARIANTS_EXECUTABLE"));
        var first = encoder.encode(image(), "image/png", false).orElseThrow();
        var second = encoder.encode(image(), "image/png", false).orElseThrow();
        assertEquals(321, first.width());
        assertEquals(640, first.height());
        assertEquals(3, first.variants().size());
        for (int width : List.of(160, 320, 321)) {
            assertArrayEquals(first.variants().get(width), second.variants().get(width));
            assertTrue(first.variants().get(width).length < image().length);
        }
    }

    @Test
    void jpegNeedingNoOrientationTransformIsEligibleButARotatedOneKeepsItsOriginal() throws Exception {
        var encoder = new ImageVariantEncoder(true, "missing-codec");
        byte[] plain = jpeg();
        assertEquals(1, ImageVariantEncoder.jpegOrientation(plain));
        assertTrue(encoder.ineligibilityReason(plain, "image/jpeg").isEmpty());

        byte[] upright = withExifOrientation(plain, 1, true);
        assertEquals(1, ImageVariantEncoder.jpegOrientation(upright));
        assertTrue(encoder.ineligibilityReason(upright, "image/jpeg").isEmpty());

        byte[] rotatedLittle = withExifOrientation(plain, 6, true);
        byte[] rotatedBig = withExifOrientation(plain, 8, false);
        assertEquals(6, ImageVariantEncoder.jpegOrientation(rotatedLittle));
        assertEquals(8, ImageVariantEncoder.jpegOrientation(rotatedBig));
        assertEquals(java.util.Optional.of("EXIF_ORIENTATION"), encoder.ineligibilityReason(rotatedLittle, "image/jpeg"));

        byte[] truncated = java.util.Arrays.copyOf(rotatedLittle, 30);
        assertEquals(-1, ImageVariantEncoder.jpegOrientation(truncated));
        assertEquals(-1, ImageVariantEncoder.jpegOrientation(new byte[]{1, 2, 3, 4}));
    }

    @Test
    void staticIneligibilityReasonsAreReported() throws Exception {
        assertEquals(java.util.Optional.of("DISABLED"),
                new ImageVariantEncoder(false, "missing-codec").ineligibilityReason(image(), "image/png"));
        var encoder = new ImageVariantEncoder(true, "missing-codec");
        assertEquals(java.util.Optional.of("UNSUPPORTED_TYPE"), encoder.ineligibilityReason(image(), "image/gif"));
        assertEquals(java.util.Optional.of("TOO_LARGE"),
                encoder.ineligibilityReason(new byte[10 * 1024 * 1024 + 1], "image/png"));
        assertTrue(encoder.ineligibilityReason(image(), "image/png").isEmpty());
    }

    @Test
    void busyEncoderIsAwaitedUntilTheCallersDeadlineInsteadOfFailingImmediately() throws Exception {
        var encoder = new ImageVariantEncoder(true, "missing-codec");
        encoder.slot.acquire();
        try {
            long started = System.nanoTime();
            var result = encoder.encode(image(), "image/png", false,
                    System.nanoTime() + java.util.concurrent.TimeUnit.MILLISECONDS.toNanos(300));
            long waitedMillis = java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
            assertTrue(result.isEmpty());
            assertTrue(waitedMillis >= 250, "waited " + waitedMillis + " ms");
            assertEquals(0, encoder.slot.availablePermits());
        } finally {
            encoder.slot.release();
        }

        var releaser = new Thread(() -> {
            try {
                Thread.sleep(100);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            encoder.slot.release();
        });
        encoder.slot.acquire();
        releaser.start();
        encoder.encode(image(), "image/png", false,
                System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5));
        releaser.join();
        assertEquals(1, encoder.slot.availablePermits(), "the slot is released after an attempted encoding");
    }

    private byte[] jpeg() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(8, 6, BufferedImage.TYPE_INT_RGB), "jpeg", output);
        return output.toByteArray();
    }

    /** Inserts an APP1 Exif segment with one IFD0 orientation entry directly after SOI. */
    private byte[] withExifOrientation(byte[] jpeg, int orientation, boolean littleEndian) {
        var tiff = java.nio.ByteBuffer.allocate(26)
                .order(littleEndian ? java.nio.ByteOrder.LITTLE_ENDIAN : java.nio.ByteOrder.BIG_ENDIAN);
        tiff.put(littleEndian ? (byte) 'I' : (byte) 'M').put(littleEndian ? (byte) 'I' : (byte) 'M');
        tiff.putShort((short) 42).putInt(8).putShort((short) 1);
        tiff.putShort((short) 0x0112).putShort((short) 3).putInt(1).putShort((short) orientation).putShort((short) 0);
        tiff.putInt(0);
        byte[] header = {'E', 'x', 'i', 'f', 0, 0};
        int length = 2 + header.length + tiff.capacity();
        var output = new ByteArrayOutputStream();
        output.write(jpeg, 0, 2);
        output.write(0xff);
        output.write(0xe1);
        output.write(length >> 8);
        output.write(length & 255);
        output.writeBytes(header);
        output.writeBytes(tiff.array());
        output.write(jpeg, 2, jpeg.length - 2);
        return output.toByteArray();
    }

    private byte[] image() throws Exception {
        BufferedImage image = new BufferedImage(321, 640, BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < 321; x++) for (int y = 0; y < 640; y++) image.setRGB(x, y, (x % 255) << 24 | (y % 255) << 16 | 0x3377);
        var output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
