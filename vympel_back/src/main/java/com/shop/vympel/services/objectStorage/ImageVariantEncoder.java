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
    private final Semaphore slot = new Semaphore(1);
    private static final Duration DEADLINE = Duration.ofSeconds(20);
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

    public Optional<Encoded> encode(byte[] bytes, String contentType, boolean cms, long deadline) {
        // Animated GIF and EXIF-bearing JPEG retain their originals. Do not silently
        // flatten animation, discard orientation, or guess transformed dimensions.
        if (!enabled || System.nanoTime() >= deadline || bytes.length > 10 * 1024 * 1024
                || !("image/png".equals(contentType) || "image/jpeg".equals(contentType))
                || ("image/jpeg".equals(contentType) && hasExif(bytes))
                || ("image/png".equals(contentType) && hasAnimation(bytes))) return Optional.empty();
        if (!slot.tryAcquire()) {
            log.info("Image variants deferred reason=encoder_busy");
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

    private boolean hasExif(byte[] bytes) {
        for (int index = 2; index + 6 < bytes.length;) {
            if ((bytes[index] & 255) != 255) return true; // Unrecognized JPEG: safe original fallback.
            int marker = bytes[index + 1] & 255;
            if (marker == 0xda || marker == 0xd9) return false;
            int length = ((bytes[index + 2] & 255) << 8) | (bytes[index + 3] & 255);
            if (length < 2 || index + 2 + length > bytes.length) return true;
            if (marker == 0xe1 && length >= 8 && bytes[index + 4] == 'E' && bytes[index + 5] == 'x'
                    && bytes[index + 6] == 'i' && bytes[index + 7] == 'f') return true;
            index += 2 + length;
        }
        return false;
    }
}
