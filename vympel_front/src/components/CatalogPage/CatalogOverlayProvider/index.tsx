"use client";

import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type CatalogOverlayType = "categories" | "filters" | "sorting" | "search";

type CatalogOverlayContextValue = {
    activeOverlay: CatalogOverlayType | null;
    closeOverlay: (overlay?: CatalogOverlayType) => void;
    isBottomNavigationHidden: boolean;
    isOverlayOpen: boolean;
    openOverlay: (overlay: CatalogOverlayType, trigger?: HTMLElement | null) => void;
};

const OVERLAY_EXIT_MS = 220;
const CatalogOverlayContext = createContext<CatalogOverlayContextValue | null>(null);

export function CatalogOverlayProvider({children}: PropsWithChildren) {
    const activeOverlayRef = useRef<CatalogOverlayType | null>(null);
    const overlayTriggerRef = useRef<HTMLElement | null>(null);
    const restoreNavigationTimerRef = useRef<number | null>(null);
    const [activeOverlay, setActiveOverlay] = useState<CatalogOverlayType | null>(null);
    const [isBottomNavigationHidden, setBottomNavigationHidden] = useState(false);

    const clearRestoreTimer = useCallback(() => {
        if (restoreNavigationTimerRef.current !== null) {
            window.clearTimeout(restoreNavigationTimerRef.current);
            restoreNavigationTimerRef.current = null;
        }
    }, []);

    const openOverlay = useCallback((overlay: CatalogOverlayType, trigger?: HTMLElement | null) => {
        clearRestoreTimer();
        activeOverlayRef.current = overlay;
        if (trigger) {
            overlayTriggerRef.current = trigger;
        }
        setBottomNavigationHidden(true);
        setActiveOverlay(overlay);
    }, [clearRestoreTimer]);

    const closeOverlay = useCallback((overlay?: CatalogOverlayType) => {
        if (overlay && activeOverlayRef.current !== overlay) {
            return;
        }

        clearRestoreTimer();
        const trigger = overlayTriggerRef.current;
        activeOverlayRef.current = null;
        setActiveOverlay(null);
        restoreNavigationTimerRef.current = window.setTimeout(() => {
            setBottomNavigationHidden(false);
            if (trigger?.isConnected) {
                trigger.focus({preventScroll: true});
            }
            if (overlayTriggerRef.current === trigger) {
                overlayTriggerRef.current = null;
            }
            restoreNavigationTimerRef.current = null;
        }, OVERLAY_EXIT_MS);
    }, [clearRestoreTimer]);

    useEffect(() => {
        const closeOverlayOnHistoryNavigation = () => closeOverlay();
        window.addEventListener("popstate", closeOverlayOnHistoryNavigation);
        return () => window.removeEventListener("popstate", closeOverlayOnHistoryNavigation);
    }, [closeOverlay]);

    useEffect(() => () => clearRestoreTimer(), [clearRestoreTimer]);

    const value = useMemo<CatalogOverlayContextValue>(() => ({
        activeOverlay,
        closeOverlay,
        isBottomNavigationHidden,
        isOverlayOpen: activeOverlay !== null,
        openOverlay,
    }), [activeOverlay, closeOverlay, isBottomNavigationHidden, openOverlay]);

    return (
        <CatalogOverlayContext.Provider value={value}>
            {children}
        </CatalogOverlayContext.Provider>
    );
}

export function useCatalogOverlay() {
    const context = useContext(CatalogOverlayContext);

    if (!context) {
        throw new Error("useCatalogOverlay must be used inside CatalogOverlayProvider");
    }

    return context;
}
