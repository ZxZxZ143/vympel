package com.shop.vympel.services.objectStorage;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

/** A ready family is published by saving its original key only after all variants exist. */
public final class ResponsiveImageLayout {
    public static final int[] WIDTHS = {160, 320, 480, 800, 1200, 1600, 1920, 2560};
    private static final Pattern ORIGINAL = Pattern.compile(
            "^(product|cms)/responsive-v1/([a-f0-9-]{36})/([a-f0-9]{64})/([1-9][0-9]{0,4})x([1-9][0-9]{0,4})/original\\.(png|jpe?g)$");

    private ResponsiveImageLayout() {}

    public static List<Integer> widths(int width, boolean cms) {
        return IntStream.of(WIDTHS).filter(w -> cms || w <= 1600)
                .map(w -> Math.min(w, width)).distinct().boxed().toList();
    }

    public static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    public static String base(String prefix, String id, byte[] bytes, int width, int height) {
        if (!List.of("product", "cms").contains(prefix)) throw new IllegalArgumentException("Invalid media area");
        return prefix + "/responsive-v1/" + id + "/" + sha256(bytes) + "/" + width + "x" + height;
    }

    /** Known bounded keys only; never list a bucket or delete a caller-controlled prefix. */
    public static List<String> ownedKeys(String originalKey) {
        var match = ORIGINAL.matcher(originalKey);
        if (!match.matches()) return List.of(originalKey);
        int width = Integer.parseInt(match.group(4));
        int height = Integer.parseInt(match.group(5));
        if (width > 10_000 || height > 10_000 || (long) width * height > 25_000_000L) return List.of(originalKey);
        String base = originalKey.substring(0, originalKey.lastIndexOf('/'));
        List<String> keys = new ArrayList<>();
        widths(width, "cms".equals(match.group(1))).forEach(w -> keys.add(base + "/w" + w + ".webp"));
        keys.add(originalKey); // Keep the original fallback until every derivative is removed.
        return List.copyOf(keys);
    }
}
