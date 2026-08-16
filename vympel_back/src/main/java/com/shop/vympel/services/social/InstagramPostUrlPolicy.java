package com.shop.vympel.services.social;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class InstagramPostUrlPolicy {
    private static final Pattern POST_PATH = Pattern.compile("^/(p|reel)/([A-Za-z0-9_-]+)/?$");

    private InstagramPostUrlPolicy() {
    }

    public static String canonicalize(String value) {
        if (value == null || value.trim().isBlank()) {
            throw invalidUrl();
        }

        try {
            URI uri = new URI(value.trim());
            String host = uri.getHost();
            if (uri.isOpaque()
                    || !"https".equalsIgnoreCase(uri.getScheme())
                    || host == null
                    || uri.getUserInfo() != null
                    || uri.getPort() != -1) {
                throw invalidUrl();
            }

            String normalizedHost = host.toLowerCase(Locale.ROOT);
            if (!normalizedHost.equals("instagram.com") && !normalizedHost.equals("www.instagram.com")) {
                throw invalidUrl();
            }

            Matcher matcher = POST_PATH.matcher(uri.getRawPath());
            if (!matcher.matches()) {
                throw invalidUrl();
            }

            return "https://www.instagram.com/" + matcher.group(1) + "/" + matcher.group(2) + "/";
        } catch (URISyntaxException ex) {
            throw invalidUrl();
        }
    }

    private static IllegalArgumentException invalidUrl() {
        return new IllegalArgumentException(
                "Instagram CMS posts must use a valid https://instagram.com/p/{id} or /reel/{id} URL"
        );
    }
}
