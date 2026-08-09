"use client";

import {useEffect, useSyncExternalStore} from "react";
import {reportTelemetry} from "@/lib/telemetry";
import {resolveGlobalErrorLocale, type ResolvedGlobalErrorLocale} from "@/app/globalErrorLocale";

const copy = {
    ru: {title: "Что-то пошло не так", body: "Обновите страницу и попробуйте снова.", retry: "Обновить страницу"},
    kz: {title: "Бірдеңе дұрыс болмады", body: "Бетті жаңартып, қайта көріңіз.", retry: "Бетті жаңарту"},
    en: {title: "Something went wrong", body: "Refresh the page and try again.", retry: "Refresh page"},
} as const;

export default function GlobalError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
    const localeKey = useSyncExternalStore(
        subscribeToGlobalErrorLocale,
        readGlobalErrorLocale,
        () => "neutral",
    );
    useEffect(() => {
        reportTelemetry({kind: "react_boundary", name: error.name, message: error.message, route: window.location.pathname});
    }, [error]);
    if (localeKey === "neutral") {
        return (
            <html lang="en">
            <body>
            <main aria-busy="true" style={{minHeight: "100vh", display: "grid", placeContent: "center", padding: 24}}>
                <span aria-hidden="true">…</span>
            </main>
            </body>
            </html>
        );
    }

    const resolvedLocale = resolveGlobalErrorLocale(window.location.pathname, document.documentElement.lang);
    const text = copy[resolvedLocale.locale];

    return (
        <html lang={resolvedLocale.htmlLanguage}>
        <body>
        <main style={{minHeight: "100vh", display: "grid", placeContent: "center", gap: 16, padding: 24, textAlign: "center"}}>
            <h1>{text.title}</h1>
            <p>{text.body}</p>
            <button type="button" onClick={reset}>{text.retry}</button>
        </main>
        </body>
        </html>
    );
}

function subscribeToGlobalErrorLocale() {
    return () => undefined;
}

function readGlobalErrorLocale(): ResolvedGlobalErrorLocale["locale"] {
    return resolveGlobalErrorLocale(window.location.pathname, document.documentElement.lang).locale;
}
