"use client";

import {useEffect} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {routes} from "@/config/routes";
import {reportTelemetry} from "@/lib/telemetry";

type CorrelatedError = Error & {digest?: string; requestId?: string; status?: number};

export default function ErrorBoundary({error, reset}: {error: CorrelatedError; reset: () => void}) {
    const t = useTranslations("telemetry");
    const supportReference = error.status && error.status >= 500 ? error.requestId : undefined;

    useEffect(() => {
        reportTelemetry({
            kind: "react_boundary",
            name: error.name,
            message: error.message,
            requestId: supportReference,
            status: error.status,
            route: window.location.pathname,
            locale: document.documentElement.lang,
        });
    }, [error, supportReference]);

    return (
        <main className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center gap-5 px-5 text-center">
            <h1 className="text-3xl text-text-heading-primary">{t("errorTitle")}</h1>
            <p className="text-text-secondary">{t("errorDescription")}</p>
            {supportReference ? <p className="text-sm text-text-muted">{t("supportReference", {requestId: supportReference})}</p> : null}
            <div className="flex flex-wrap justify-center gap-3">
                <button type="button" onClick={reset} className="rounded-full bg-button-bg-action px-6 py-3 text-button-text-action">
                    {t("retry")}
                </button>
                <Link href={routes.home()} className="rounded-full border border-border-default px-6 py-3">
                    {t("home")}
                </Link>
            </div>
        </main>
    );
}
