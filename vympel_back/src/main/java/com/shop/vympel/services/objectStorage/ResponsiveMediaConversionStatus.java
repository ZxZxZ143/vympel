package com.shop.vympel.services.objectStorage;

/** Outcome of one legacy media conversion attempt. */
public enum ResponsiveMediaConversionStatus {
    /** The family was published and the reference now points to its original. */
    CONVERTED(false),
    /** Dry run: every check passed and the row would be converted. */
    WOULD_CONVERT(false),
    ALREADY_RESPONSIVE(true),
    /** GIF, animated PNG, JPEG needing an EXIF rotation, too large, or encoding disabled. */
    NOT_ELIGIBLE(true),
    /** Not a {@code <area>/<uuid>.png|jpg|jpeg} key; seeded or foreign keys are left alone. */
    UNSUPPORTED_KEY(true),
    /** The key is also referenced by another row and is never rewritten alone. */
    SHARED(true),
    /** Orphaned CMS media awaiting cleanup. */
    UNREFERENCED(true),
    /** CMS media that is not active object storage. */
    INACTIVE(true),
    /** The reference changed after selection; nothing was written. */
    CHANGED(false),
    /** The row no longer exists. */
    GONE(true),
    MISSING_ORIGINAL(true),
    INVALID_ORIGINAL(true),
    /** The encoder was busy, timed out or failed; a later attempt may succeed. */
    ENCODER_UNAVAILABLE(false),
    /** A family key already holds different bytes; created objects were rolled back. */
    CONFLICT(true),
    FAILED(false);

    private final boolean terminal;

    ResponsiveMediaConversionStatus(boolean terminal) {
        this.terminal = terminal;
    }

    /** Terminal outcomes do not change on a retry without an external change. */
    public boolean terminal() {
        return terminal;
    }
}
