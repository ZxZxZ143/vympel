import {describe, expect, it, vi} from "vitest";

import {
    CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS,
    getCatalogSearchRestoreTarget,
    reduceCatalogOverlay,
} from "@/components/CatalogPage/CatalogOverlayProvider/state";

describe("catalog overlay state", () => {
    it("closes search once and remains closed after another close update", () => {
        const opened = reduceCatalogOverlay(null, {type: "open", overlay: "search"});
        const closed = reduceCatalogOverlay(opened, {type: "close", overlay: "search"});
        const afterQueuedClose = reduceCatalogOverlay(closed, {type: "close", overlay: "search"});

        expect(opened).toBe("search");
        expect(closed).toBeNull();
        expect(afterQueuedClose).toBeNull();
    });

    it("does not turn an explicit close into a toggle reopen", () => {
        const closeHandler = vi.fn((current: ReturnType<typeof reduceCatalogOverlay>) => (
            reduceCatalogOverlay(current, {type: "close", overlay: "search"})
        ));
        const openHandler = vi.fn();

        const closed = closeHandler("search");

        expect(closed).toBeNull();
        expect(closeHandler).toHaveBeenCalledOnce();
        expect(openHandler).not.toHaveBeenCalled();
    });

    it("does not restore focus to the desktop input that opens search on focus", () => {
        let overlay = reduceCatalogOverlay(null, {type: "open", overlay: "search"});
        const desktopInput = {
            focus: vi.fn(() => {
                overlay = reduceCatalogOverlay(overlay, {type: "open", overlay: "search"});
            }),
        };

        overlay = reduceCatalogOverlay(overlay, {type: "close", overlay: "search"});
        const restoreTarget = getCatalogSearchRestoreTarget(false, desktopInput);
        restoreTarget?.focus();

        expect(restoreTarget).toBeNull();
        expect(desktopInput.focus).not.toHaveBeenCalled();
        expect(overlay).toBeNull();
    });

    it("retains the compact trigger as the safe focus restoration target", () => {
        const compactTrigger = {focus: vi.fn()};

        expect(getCatalogSearchRestoreTarget(true, compactTrigger)).toBe(compactTrigger);
    });

    it("closes search on one Escape transition", () => {
        const opened = reduceCatalogOverlay(null, {type: "open", overlay: "search"});
        const afterEscape = reduceCatalogOverlay(opened, {type: "close", overlay: "search"});

        expect(afterEscape).toBeNull();
    });

    it("coordinates search and sort through one active overlay", () => {
        const searchOpen = reduceCatalogOverlay(null, {type: "open", overlay: "search"});
        const sortOpen = reduceCatalogOverlay(searchOpen, {type: "open", overlay: "sorting"});
        const allClosed = reduceCatalogOverlay(sortOpen, {type: "close", overlay: "sorting"});

        expect(searchOpen).toBe("search");
        expect(sortOpen).toBe("sorting");
        expect(allClosed).toBeNull();
    });

    it("uses the shared 48px toolbar height class", () => {
        expect(CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS).toBe("h-12");
    });
});
