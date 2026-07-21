"use client";

import { useMemo, useState } from "react";
import { CrmLocale, locales, messages } from "@/shared/i18n/messages";

const STORAGE_KEY = "vympel_crm_locale";

function isLocale(value: string | null): value is CrmLocale {
  return value !== null && (locales as readonly string[]).includes(value);
}

function readInitialLocale(): CrmLocale {
  if (typeof window === "undefined") {
    return "ru";
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(saved) ? saved : "ru";
}

export function useI18n() {
  const [locale, setLocaleState] = useState<CrmLocale>(() => readInitialLocale());

  const setLocale = (nextLocale: CrmLocale) => {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
  };

  const t = useMemo(() => {
    return (key: string): string => {
      const value = key
        .split(".")
        .reduce<unknown>((current, segment) => {
          if (current && typeof current === "object" && segment in current) {
            return (current as Record<string, unknown>)[segment];
          }
          return undefined;
        }, messages[locale]);

      return typeof value === "string" ? value : key;
    };
  }, [locale]);

  return { locale, locales, messages: messages[locale], setLocale, t };
}
