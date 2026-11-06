package com.shop.vympel.services.objectStorage;

import java.util.List;

/**
 * Published inside an upload transaction when an eligible raster kept only its original because the
 * encoder was busy, timed out or failed. Listeners act only after the upload commits.
 */
public record ResponsiveMediaPendingEvent(ResponsiveMediaArea area, List<Item> items) {
    public ResponsiveMediaPendingEvent {
        items = List.copyOf(items);
    }

    public record Item(Long mediaId, String objectKey) {
    }
}
