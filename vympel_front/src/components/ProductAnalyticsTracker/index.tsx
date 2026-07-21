"use client";

import {useEffect} from "react";

import {PublicApiController} from "@/api/controllers/PublicController";

type Props = {
    productId: number;
};

const sessionKey = "vympel_analytics_session_id";

function getSessionId() {
    try {
        const current = window.sessionStorage.getItem(sessionKey);
        if (current) {
            return current;
        }

        const next = typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.sessionStorage.setItem(sessionKey, next);
        return next;
    } catch {
        return undefined;
    }
}

function shouldTrackView(productId: number) {
    try {
        const key = `vympel_product_view_${productId}`;
        if (window.sessionStorage.getItem(key)) {
            return false;
        }

        window.sessionStorage.setItem(key, "1");
        return true;
    } catch {
        return true;
    }
}

export function trackProductEvent(
    productId: number,
    eventType: "VIEW" | "FAVORITE" | "UNFAVORITE" | "ADD_TO_CART" | "REMOVE_FROM_CART"
) {
    void PublicApiController.trackProductEvent({
        productId,
        eventType,
        sessionId: getSessionId(),
    });
}

export default function ProductAnalyticsTracker({productId}: Props) {
    useEffect(() => {
        if (!shouldTrackView(productId)) {
            return;
        }

        trackProductEvent(productId, "VIEW");
    }, [productId]);

    return null;
}
