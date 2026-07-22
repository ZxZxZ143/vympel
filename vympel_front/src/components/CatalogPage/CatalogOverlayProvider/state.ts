export type CatalogOverlayType = "categories" | "filters" | "sorting" | "search";

export type CatalogOverlayAction =
    | {type: "open"; overlay: CatalogOverlayType}
    | {type: "close"; overlay?: CatalogOverlayType};

export const CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS = "h-12";

export function reduceCatalogOverlay(
    currentOverlay: CatalogOverlayType | null,
    action: CatalogOverlayAction
): CatalogOverlayType | null {
    if (action.type === "open") {
        return action.overlay;
    }

    if (action.overlay && currentOverlay !== action.overlay) {
        return currentOverlay;
    }

    return null;
}

export function getCatalogSearchRestoreTarget<T>(
    usesCompactTrigger: boolean,
    compactTrigger: T | null
): T | null {
    return usesCompactTrigger ? compactTrigger : null;
}
