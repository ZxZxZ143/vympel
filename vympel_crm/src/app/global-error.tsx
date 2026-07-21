"use client";

import {useEffect} from "react";
import {useI18n} from "@/shared/i18n/useI18n";
import {reportTelemetry} from "@/shared/telemetry/telemetry";

export default function GlobalError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const {locale, t} = useI18n();
  useEffect(() => {
    reportTelemetry({kind: "react_boundary", name: error.name, message: error.message, route: window.location.pathname, locale});
  }, [error, locale]);

  return (
    <html lang={locale}>
    <body>
      <main style={{minHeight: "100vh", display: "grid", placeContent: "center", gap: 16, padding: 24, textAlign: "center"}}>
        <h1>{t("telemetry.errorTitle")}</h1>
        <p>{t("telemetry.errorDescription")}</p>
        <button type="button" onClick={reset}>{t("telemetry.retry")}</button>
      </main>
    </body>
    </html>
  );
}
