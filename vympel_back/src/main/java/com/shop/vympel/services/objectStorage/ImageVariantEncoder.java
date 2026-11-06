package com.shop.vympel.services.objectStorage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/** Upload-time, single-process encoding. No browser request can invoke the encoder. */
@Component
@Slf4j
public class ImageVariantEncoder {
    private final boolean enabled;
    private final String executable;
    final Semaphore slot = new Semaphore(1);
    private static final Duration DEADLINE = Duration.ofSeconds(20);
    private static final int MAX_INPUT_BYTES = 10 * 1024 * 1024;
    private static final long MAX_OUTPUT_BYTES = 32L * 1024 * 1024;

    public ImageVariantEncoder(
            @Value("${app.image-variants.enabled:true}") boolean enabled,
            @Value("${app.image-variants.executable:cwebp}") String executable) {
        this.enabled = enabled;
        this.executable = executable;
    }

    public record Encoded(int width, int height, Map<Integer, byte[]> variants) {}

    public Optional<Encoded> encode(byte[] bytes, String contentType, boolean cms) {
        return encode(bytes, contentType, cms, System.nanoTime() + DEADLINE.toNanos());
    }

    /**
     * Static reasons an image must keep only its original. Empty means encoding may be attempted.
     * Animated GIF/APNG and JPEG needing an EXIF orientation transform retain their originals:
     * never flatten animation, discard orientation, or guess transformed dimensions.
     */
    public Optional<String> ineligibilityReason(byte[] bytes, String contentType) {
        if (!enabled) return Optional.of("DISABLED");
        if (bytes == null || bytes.length > MAX_INPUT_BYTES) return Optional.of("TOO_LARGE");
        if (!("image/png".equals(contentType) || "image/jpeg".equals(contentType))) {
            return Optional.of("UNSUPPORTED_TYPE");
        }
        if ("image/jpeg".equals(contentType) && jpegOrientation(bytes) != 1) return Optional.of("EXIF_ORIENTATION");
        if ("image/png".equals(contentType) && hasAnimation(bytes)) return Optional.of("ANIMATED");
        return Optional.empty();
    }

    public Optional<Encoded> encode(byte[] bytes, String contentType, boolean cms, long deadline) {
        if (System.nanoTime() >= deadline || ineligibilityReason(bytes, contentType).isPresent()) return Optional.empty();
        // A concurrent upload or deferred conversion holds the single slot: wait for it within
        // this caller's own deadline instead of silently keeping a heavy original.
        try {
            if (!slot.tryAcquire(Math.max(0L, deadline - System.nanoTime()), TimeUnit.NANOSECONDS)) {
                log.info("Image variants deferred reason=encoder_busy");
                return Optional.empty();
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
        Path directory = null;
        try {
            int width;
            int height;
            try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) return Optional.empty();
                var reader = readers.next();
                try {
                    reader.setInput(input);
                    width = reader.getWidth(0);
                    height = reader.getHeight(0);
                } finally {
                    reader.dispose();
                }
            }
            if (width <= 0 || height <= 0 || width > 10_000 || height > 10_000
                    || (long) width * height > 25_000_000L) return Optional.empty();
            directory = Files.createTempDirectory("vympel-image-");
            Path source = directory.resolve("source");
            Files.write(source, bytes);
            Map<Integer, byte[]> variants = new LinkedHashMap<>();
            long totalBytes = 0;
            for (int target : ResponsiveImageLayout.widths(width, cms)) {
                Path output = directory.resolve("w" + target + ".webp");
                long remaining = deadline - System.nanoTime();
                if (remaining <= 0) throw new IOException("encoding_timeout");
                Process process = new ProcessBuilder(executable, "-quiet", "-q", "88", "-alpha_q", "100",
                        "-m", "4", "-sharp_yuv", "-metadata", "icc", "-resize", String.valueOf(target), "0",
                        source.toString(), "-o", output.toString())
                        .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                        .redirectError(ProcessBuilder.Redirect.DISCARD).start();
                try {
                    if (!process.waitFor(remaining, TimeUnit.NANOSECONDS) || process.exitValue() != 0) {
                        throw new IOException("encoding_failed_or_timeout");
                    }
                } finally {
                    if (process.isAlive()) {
                        process.destroyForcibly();
                        process.waitFor(2, TimeUnit.SECONDS);
                    }
                }
                totalBytes += Files.size(output);
                if (totalBytes > MAX_OUTPUT_BYTES) throw new IOException("encoding_output_limit");
                byte[] encoded = Files.readAllBytes(output);
                if (encoded.length < 12 || encoded[0] != 'R' || encoded[8] != 'W') throw new IOException("invalid_webp");
                variants.put(target, encoded);
            }
            return Optional.of(new Encoded(width, height, Map.copyOf(variants)));
        } catch (IOException | RuntimeException exception) {
            log.warn("Image variants unavailable; original retained reason={}", exception.getClass().getSimpleName());
            return Optional.empty();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } finally {
            if (directory != null) {
                try {
                    java.util.List<Path> children;
                    try (var files = Files.list(directory)) { children = files.toList(); }
                    for (Path file : children) Files.deleteIfExists(file);
                    Files.deleteIfExists(directory);
                } catch (IOException exception) {
                    log.warn("Image encoder temporary-file cleanup failed");
                }
            }
            slot.release();
        }
    }

    static boolean hasAnimation(byte[] bytes) {
        // Parse PNG chunks, not arbitrary payload text. ImageIO's PNG reader does
        // not expose APNG frames; encoding one frame would silently lose motion.
        for (int offset = 8; offset + 12 <= bytes.length;) {
            long length = Integer.toUnsignedLong(java.nio.ByteBuffer.wrap(bytes, offset, 4).getInt());
            if (length > bytes.length - offset - 12) return true;
            if (bytes[offset + 4] == 'a' && bytes[offset + 5] == 'c'
                    && bytes[offset + 6] == 'T' && bytes[offset + 7] == 'L') return true;
            offset += (int) length + 12;
        }
        return false;
    }

    /**
     * Returns 1 when the JPEG needs no orientation transform (no EXIF, or EXIF orientation 1),
     * the EXIF orientation 2..8 otherwise, or -1 when the container cannot be parsed safely.
     */
    static int jpegOrientation(byte[] bytes) {
        if (bytes.length < 4 || (bytes[0] & 255) != 0xff || (bytes[1] & 255) != 0xd8) return -1;
        int orientation = 1;
        for (int index = 2; index + 4 <= bytes.length;) {
            if ((bytes[index] & 255) != 255) return -1; // Unrecognized JPEG: safe original fallback.
            int marker = bytes[index + 1] & 255;
            if (marker == 0xda || marker == 0xd9) return orientation;
            int length = ((bytes[index + 2] & 255) << 8) | (bytes[index + 3] & 255);
            int end = index + 2 + length;
            if (length < 2 || end > bytes.length) return -1;
            if (marker == 0xe1 && length >= 8 && bytes[index + 4] == 'E' && bytes[index + 5] == 'x'
                    && bytes[index + 6] == 'i' && bytes[index + 7] == 'f'
                    && bytes[index + 8] == 0 && bytes[index + 9] == 0) {
                int value = exifOrientation(bytes, index + 10, end);
                if (value < 0) return -1;
                orientation = value;
            }
            index = end;
        }
        return -1;
    }

    private static int exifOrientation(byte[] bytes, int tiff, int end) {
        if (tiff + 8 > end) return -1;
        boolean little;
        if (bytes[tiff] == 'I' && bytes[tiff + 1] == 'I') little = true;
        else if (bytes[tiff] == 'M' && bytes[tiff + 1] == 'M') little = false;
        else return -1;
        if (unsignedShort(bytes, tiff + 2, little) != 42) return -1;
        long ifdOffset = unsignedInt(bytes, tiff + 4, little);
        if (ifdOffset < 8 || ifdOffset > end - tiff - 2L) return -1;
        int ifd = tiff + (int) ifdOffset;
        int entries = unsignedShort(bytes, ifd, little);
        for (int entry = 0; entry < entries; entry++) {
            int offset = ifd + 2 + entry * 12;
            if (offset + 12 > end) return -1;
            if (unsignedShort(bytes, offset, little) != 0x0112) continue;
            int type = unsignedShort(bytes, offset + 2, little);
            long count = unsignedInt(bytes, offset + 4, little);
            int value = unsignedShort(bytes, offset + 8, little);
            return type == 3 && count == 1 && value >= 1 && value <= 8 ? value : -1;
        }
        return 1;
    }

    private static int unsignedShort(byte[] bytes, int offset, boolean little) {
        int first = bytes[offset] & 255;
        int second = bytes[offset + 1] & 255;
        return little ? first | (second << 8) : (first << 8) | second;
    }

    private static long unsignedInt(byte[] bytes, int offset, boolean little) {
        long value = 0;
        for (int index = 0; index < 4; index++) {
            int shift = little ? index * 8 : (3 - index) * 8;
            value |= (long) (bytes[offset + index] & 255) << shift;
        }
        return value;
    }
}
