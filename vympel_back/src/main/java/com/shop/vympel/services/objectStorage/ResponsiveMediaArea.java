package com.shop.vympel.services.objectStorage;

/** Media owners whose legacy originals can gain a responsive-v1 family. */
public enum ResponsiveMediaArea {
    PRODUCT("product"),
    CMS("cms");

    private final String prefix;

    ResponsiveMediaArea(String prefix) {
        this.prefix = prefix;
    }

    public String prefix() {
        return prefix;
    }
}
