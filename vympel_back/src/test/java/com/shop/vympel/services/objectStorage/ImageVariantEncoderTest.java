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

    private byte[] image() throws Exception {
        BufferedImage image = new BufferedImage(321, 640, BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < 321; x++) for (int y = 0; y < 640; y++) image.setRGB(x, y, (x % 255) << 24 | (y % 255) << 16 | 0x3377);
        var output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
