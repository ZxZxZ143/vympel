package com.shop.vympel.services.social;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class InstagramPostUrlPolicyTest {

    @Test
    void canonicalizesPostAndReelUrlsAndRemovesTrackingData() {
        assertEquals(
                "https://www.instagram.com/p/AbC_12-3/",
                InstagramPostUrlPolicy.canonicalize(" https://instagram.com/p/AbC_12-3?igsh=tracking ")
        );
        assertEquals(
                "https://www.instagram.com/reel/xyz987/",
                InstagramPostUrlPolicy.canonicalize("https://www.instagram.com/reel/xyz987/#fragment")
        );
    }

    @Test
    void rejectsUnsafeHostsSchemesAndNonPostPaths() {
        for (String value : new String[]{
                "javascript:alert(1)",
                "http://instagram.com/p/abc",
                "https://instagram.com.evil.test/p/abc",
                "https://instagram.com:443/p/abc",
                "https://instagram.com@evil.test/p/abc",
                "https://instagram.com/",
                "https://instagram.com/stories/abc",
                "https://instagram.com/p/abc/embed",
                "https://instagram.com/p/abc%2Fembed",
                "not a url"
        }) {
            assertThrows(IllegalArgumentException.class, () -> InstagramPostUrlPolicy.canonicalize(value), value);
        }
    }
}
