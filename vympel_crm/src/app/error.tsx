"use client";

import {useEffect} from "react";
import {CrmApiError} from "@/shared/api/client";
import {useI18n} from "@/shared/i18n/useI18n";
import {reportTelemetry} from "@/shared/telemetry/telemetry";

export default function ErrorBoundary({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const {t} = useI18n();
  const apiError = error instanceof CrmApiError ? error : null;
  const supportReference = apiError && apiError.status >= 500 ? apiError.requestId : undefined;

  useEffect(() => {
    reportTelemetry({
      kind: "react_boundary",
      name: error.name,
      message: error.message,
      requestId: supportReference,
      status: apiError?.status,
      route: window.location.pathname,
      locale: window.localStorage.getItem("vympel_crm_locale") ?? "ru",
    });
  }, [apiError?.status, error, supportReference]);

  return (
    <main className="crm-auth-shell">
      <section className="crm-panel crm-auth-card">
        <div className="crm-panel__body crm-stack">
          <h1>{t("telemetry.errorTitle")}</h1>
          <p>{t("telemetry.errorDescription")}</p>
          {supportReference ? <p>{t("telemetry.supportReference")}: {supportReference}</p> : null}
          <button type="button" className="crm-button crm-button--primary" onClick={reset}>{t("telemetry.retry")}</button>
        </div>
      </section>
    </main>
  );
}
