"use client";

import {useEffect, useRef, useState, useSyncExternalStore} from "react";
import {useTranslations} from "use-intl";
import {privacyChoice, setPrivacyChoice, subscribePrivacy, type PrivacyChoice} from "@/services/privacyPreferences";

export default function PrivacyNotice() {
    const t = useTranslations("privacy");
    const choice = useSyncExternalStore(subscribePrivacy, privacyChoice, () => "server" as const);
    const [editing, setEditing] = useState(false);
    const noticeRef = useRef<HTMLElement>(null);
    const settingsRef = useRef<HTMLButtonElement>(null);
    const visible = choice !== "server" && (choice === null || editing);
    useEffect(() => {
        const notice = noticeRef.current;
        if (!visible || !notice) return;
        const update = () => document.documentElement.style.setProperty("--privacy-notice-height", `${notice.getBoundingClientRect().height + 16}px`);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(notice);
        return () => {
            observer.disconnect();
            document.documentElement.style.removeProperty("--privacy-notice-height");
        };
    }, [visible]);
    const choose = (value: PrivacyChoice) => {
        setPrivacyChoice(value);
        setEditing(false);
        settingsRef.current?.focus({preventScroll: true});
    };
    return <>
        <div className="privacy-settings"><button ref={settingsRef} type="button" onClick={() => setEditing(true)} aria-expanded={visible}>{t("settings")}</button></div>
        {visible ? <section ref={noticeRef} className="privacy-notice" aria-label={t("title")}>
            <div className="privacy-notice__copy">
                <p className="privacy-notice__title">{t("title")}</p>
                <p>{t("body")}</p>
                <details><summary>{t("details")}</summary><p>{t("detailText")}</p></details>
            </div>
            <div className="privacy-notice__actions">
                <button type="button" onClick={() => choose("essential")}>{t("essential")}</button>
                <button type="button" onClick={() => choose("analytics")}>{t("analytics")}</button>
            </div>
        </section> : null}
    </>;
}
