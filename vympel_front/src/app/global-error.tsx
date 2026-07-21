"use client";

import {useEffect, useState} from "react";
import {reportTelemetry} from "@/lib/telemetry";

const copy = {
    ru: {title: "Что-то пошло не так", body: "Обновите страницу и попробуйте снова.", retry: "Обновить страницу"},
    kz: {title: "Бірдеңе дұрыс болмады", body: "Бетті жаңартып, қайта көріңіз.", retry: "Бетті жаңарту"},
    en: {title: "Something went wrong", body: "Refresh the page and try again.", retry: "Refresh page"},
} as const;

export default function GlobalError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
    const [locale] = useState<keyof typeof copy>(() => {
        if (typeof document === "undefined") return "ru";
        const documentLocale = document.documentElement.lang;
        return documentLocale === "ru" || documentLocale === "kz" || documentLocale === "en"
            ? documentLocale
            : "ru";
    });
    useEffect(() => {
        reportTelemetry({kind: "react_boundary", name: error.name, message: error.message, route: window.location.pathname});
    }, [error]);
    const text = copy[locale];

    return (
        <html lang={locale}>
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
