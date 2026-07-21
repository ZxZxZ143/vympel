"use client";

import {useEffect, type ReactNode} from "react";
import {useReportWebVitals} from "next/web-vitals";
import {createTelemetryDeduper, reportTelemetry, type TelemetryEvent} from "@/lib/telemetry";

const isFirstReport = createTelemetryDeduper();

function context(): Pick<TelemetryEvent, "route" | "locale" | "deviceClass"> {
    const width = window.innerWidth;
    return {
        route: window.location.pathname,
        locale: document.documentElement.lang,
        deviceClass: width < 768 ? "mobile" : width < 1200 ? "tablet" : "desktop",
    };
}

function reportOnce(event: TelemetryEvent) {
    if (!isFirstReport(event)) return;
    reportTelemetry(event);
}

export default function TelemetryProvider({children}: {children: ReactNode}) {
    useReportWebVitals((metric) => {
        if (!["CLS", "FCP", "INP", "LCP", "TTFB"].includes(metric.name)) return;
        reportTelemetry({
            kind: "web_vital",
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            ...context(),
        });
    });

    useEffect(() => {
        const onError = (event: ErrorEvent) => reportOnce({
            kind: "runtime_error",
            name: event.error?.name ?? "Error",
            message: event.message,
            ...context(),
        });
        const onRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            reportOnce({
                kind: "runtime_error",
                name: reason instanceof Error ? reason.name : "UnhandledRejection",
                message: reason instanceof Error ? reason.message : String(reason),
                ...context(),
            });
        };
        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);
        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, []);

    return children;
}
