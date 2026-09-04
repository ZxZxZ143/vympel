"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import type { KaspiImportPreview } from "@/shared/api/types";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { Text } from "@/shared/ui/Text";

type KaspiImportDialogProps = {
  open: boolean;
  categoryId: number;
  locale: string;
  t: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onApply: (preview: KaspiImportPreview) => void;
};

const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "products.kaspiImportInvalidUrl",
  KASPI_URL_INVALID: "products.kaspiImportInvalidUrl",
  KASPI_URL_UNSUPPORTED: "products.kaspiImportUnsupportedUrl",
  KASPI_HOST_UNSUPPORTED: "products.kaspiImportUnsupportedUrl",
  KASPI_ADDRESS_BLOCKED: "products.kaspiImportUnsupportedUrl",
  KASPI_FETCH_TIMEOUT: "products.kaspiImportTimeout",
  KASPI_FETCH_FORBIDDEN: "products.kaspiImportForbidden",
  KASPI_PRODUCT_NOT_FOUND: "products.kaspiImportNotFound",
  KASPI_UPSTREAM_RATE_LIMITED: "products.kaspiImportUpstreamLimited",
  KASPI_IMPORT_BUSY: "products.kaspiImportBusy",
  KASPI_RESPONSE_TOO_LARGE: "products.kaspiImportInvalidResponse",
  KASPI_RESPONSE_INVALID: "products.kaspiImportInvalidResponse",
  KASPI_PARSE_FAILED: "products.kaspiImportParseFailed",
};

const warningMessages: Record<string, string> = {
  PRICE_NOT_FOUND: "products.kaspiWarningPriceMissing",
  PRICE_AMBIGUOUS: "products.kaspiWarningPriceAmbiguous",
  DESCRIPTION_NOT_FOUND: "products.kaspiWarningDescriptionMissing",
  CHARACTERISTICS_NOT_FOUND: "products.kaspiWarningCharacteristicsMissing",
  NAME_NOT_FOUND: "products.kaspiWarningNameMissing",
  BRAND_UNRESOLVED: "products.kaspiWarningBrandUnresolved",
  UNMAPPED_CHARACTERISTICS_PRESENT: "products.kaspiWarningUnmapped",
  UNRESOLVED_VALUES_PRESENT: "products.kaspiWarningUnresolved",
};

const targetLabels: Record<string, string> = {
  nameRu: "products.nameRu",
  brandId: "products.brand",
  model: "products.model",
  price: "products.price",
  descriptionRu: "products.descriptionRu",
  kaspiUrl: "products.kaspiUrl",
  "watchDetails.mechanismId": "products.mechanism",
  "watchDetails.genderId": "products.gender",
  "watchDetails.caseMaterialId": "products.caseMaterial",
  "watchDetails.strapMaterialId": "products.strapMaterial",
  "watchDetails.glassTypeId": "products.glassType",
  "watchDetails.caseSizeMm": "products.caseSizeMm",
  "watchDetails.waterResistance": "products.waterResistance",
  "watchDetails.waterResistanceId": "products.waterResistance",
  "watchDetails.stoneInlayId": "products.stoneInlay",
  "watchDetails.dialTypeId": "products.dialType",
  "watchDetails.dialMarkingId": "products.dialMarking",
  "watchDetails.powerSourceId": "products.watchPowerSource",
  "watchDetails.strapColorId": "products.strapColor",
  "watchDetails.dialColorId": "products.dialColor",
  "watchDetails.packageContents": "products.packageContents",
  "watchDetails.featureIds": "products.watchFeatures",
  "interiorClockDetails.productionCountryId": "products.productionCountry",
  "interiorClockDetails.caseMaterialId": "products.interiorCaseMaterial",
  "interiorClockDetails.colorId": "products.interiorColor",
  "interiorClockDetails.styleId": "products.interiorStyle",
  "interiorClockDetails.mechanismTypeId": "products.interiorMechanismType",
  "interiorClockDetails.powerTypeId": "products.powerType",
  "interiorClockDetails.dimensions": "products.dimensions",
  "interiorClockDetails.weightGrams": "products.weightGrams",
  "interiorClockDetails.warrantyMonths": "products.warrantyMonths",
  "accessoryDetails.claspType": "products.accessoryClaspType",
  "accessoryDetails.caseMaterialId": "products.accessoryCaseMaterial",
  "accessoryDetails.insertMaterialId": "products.accessoryInsertMaterial",
  "accessoryDetails.hasInsert": "products.accessoryHasInsert",
  "accessoryDetails.colorId": "products.accessoryColor",
  "accessoryDetails.length": "products.accessoryLength",
};

export function KaspiImportDialog({
  open,
  categoryId,
  locale,
  t,
  onOpenChange,
  onApply,
}: KaspiImportDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const formId = useId();
  const errorId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const loadingRef = useRef(false);
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<KaspiImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
    loadingRef.current = loading;
  }, [loading, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlayRef.current)
      .map((element) => ({ element, inert: element.inert, ariaHidden: element.getAttribute("aria-hidden") }));
    background.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    urlRef.current?.focus();

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loadingRef.current) {
        setUrl("");
        setPreview(null);
        setError(null);
        setLoading(false);
        onOpenChangeRef.current(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyboard);
    return () => {
      document.removeEventListener("keydown", handleKeyboard);
      abortRef.current?.abort();
      document.body.style.overflow = previousOverflow;
      background.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (open && preview) {
      scrollBodyRef.current?.focus({ preventScroll: true });
    }
  }, [open, preview]);

  if (!open || !mounted) return null;

  const close = () => {
    if (!loading) {
      setUrl("");
      setPreview(null);
      setError(null);
      onOpenChange(false);
    }
  };

  const importProduct = async () => {
    if (loading) return;
    if (!isValidKaspiProductUrl(url)) {
      setError(t("products.kaspiImportInvalidUrl"));
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;
    setLoading(true);
    setError(null);
    try {
      const nextPreview = await crmApi.importKaspiProduct({ url: url.trim(), categoryId }, locale, abort.signal);
      setPreview(nextPreview);
    } catch (caught) {
      if (!abort.signal.aborted) {
        const codeMessages = Object.fromEntries(
          Object.entries(errorMessages).map(([code, key]) => [code, t(key)]),
        );
        setError(getCrmErrorMessage(caught, t("products.kaspiImportError"), t("products.kaspiImportInvalidUrl"), codeMessages));
      }
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
      if (!abort.signal.aborted) setLoading(false);
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="crm-confirm-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="crm-confirm-dialog crm-kaspi-dialog"
        role="dialog"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          aria-label={t("common.cancel")}
          className="crm-confirm-dialog__close"
          disabled={loading}
          type="button"
          onClick={close}
        >
          ×
        </button>

        <header className="crm-kaspi-dialog__header">
          <h2 className="crm-confirm-dialog__title" id={titleId}>{t("products.kaspiImportTitle")}</h2>
          <Text id={descriptionId} tone="muted" size="small">
            {t(preview ? "products.kaspiImportPreview" : "products.kaspiImportHelp")}
          </Text>
        </header>

        <div
          ref={scrollBodyRef}
          aria-label={preview ? t("products.kaspiImportPreview") : undefined}
          className="crm-confirm-dialog__body crm-kaspi-dialog__body"
          tabIndex={preview ? 0 : -1}
        >
          {!preview ? (
            <form
              className="crm-kaspi-dialog__form"
              id={formId}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void importProduct();
              }}
            >
              <Field htmlFor="kaspiImportUrl" label={t("products.kaspiImportUrl")}>
                <input
                  ref={urlRef}
                  aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
                  aria-invalid={error ? "true" : undefined}
                  id="kaspiImportUrl"
                  className="crm-input"
                  type="url"
                  value={url}
                  disabled={loading}
                  placeholder="https://kaspi.kz/shop/p/..."
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setError(null);
                  }}
                />
              </Field>
            </form>
          ) : (
            <ImportPreview preview={preview} t={t} />
          )}
          {error ? <Text id={errorId} className="crm-form-error" role="alert">{error}</Text> : null}
        </div>

        <div className="crm-confirm-dialog__actions">
          <Button ref={cancelRef} variant="secondary" disabled={loading} onClick={close}>
            {t("common.cancel")}
          </Button>
          {preview ? (
            <Button onClick={() => {
              onApply(preview);
              setUrl("");
              setPreview(null);
              setError(null);
              onOpenChange(false);
            }}>
              {t("products.kaspiImportApply")}
            </Button>
          ) : (
            <Button form={formId} type="submit" isLoading={loading} disabled={!url.trim()}>
              {loading ? t("products.kaspiImportLoading") : t("products.kaspiImportAction")}
            </Button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function ImportPreview({ preview, t }: { preview: KaspiImportPreview; t: (key: string) => string }) {
  return (
    <div className="crm-import-preview">
      <PreviewSection title={t("products.kaspiImportMappedFields")} empty={t("products.kaspiImportEmpty")}>
        {preview.mappedFields.map((item) => (
          <li key={`${item.targetField}-${item.resolvedValue}`}>
            <strong>{targetLabel(item.targetField, t)}:</strong> {item.resolvedValue}
          </li>
        ))}
      </PreviewSection>
      <PreviewSection title={t("products.kaspiImportMappedCharacteristics")} empty={t("products.kaspiImportEmpty")}>
        {preview.mappedCharacteristics.map((item, index) => (
          <li key={`${item.targetField}-${item.sourceLabel}-${index}`}>
            <strong>{item.sourceLabel}:</strong> {item.sourceValue} → {item.resolvedValue}
          </li>
        ))}
      </PreviewSection>
      <PreviewSection title={t("products.kaspiImportUnmapped")} empty={t("products.kaspiImportEmpty")}>
        {preview.unmappedCharacteristics.map((item, index) => (
          <li key={`${item.sourceLabel}-${index}`}>
            <strong>{item.sourceLabel}:</strong> {item.sourceValue} — {reasonLabel(item.reason, t)}
          </li>
        ))}
      </PreviewSection>
      <PreviewSection title={t("products.kaspiImportUnresolved")} empty={t("products.kaspiImportEmpty")}>
        {preview.unresolvedCharacteristics.map((item, index) => (
          <li key={`${item.targetField}-${item.sourceLabel}-${index}`}>
            <strong>{item.sourceLabel}:</strong> {item.sourceValue} — {reasonLabel(item.reason, t)}
          </li>
        ))}
      </PreviewSection>
      {preview.warnings.length > 0 ? (
        <PreviewSection title={t("products.kaspiImportWarnings")} empty={t("products.kaspiImportEmpty")}>
          {preview.warnings.map((warning) => (
            <li key={warning}>{t(warningMessages[warning] ?? "products.kaspiWarningPartial")}</li>
          ))}
        </PreviewSection>
      ) : null}
    </div>
  );
}

function PreviewSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const populated = items.filter(Boolean);
  return (
    <section className="crm-import-preview__section">
      <h3>{title}</h3>
      {populated.length > 0 ? <ul>{populated}</ul> : <Text tone="muted" size="small">{empty}</Text>}
    </section>
  );
}

function targetLabel(field: string, t: (key: string) => string) {
  return t(targetLabels[field] ?? "products.kaspiImportValue");
}

function reasonLabel(reason: string, t: (key: string) => string) {
  if (reason === "UNKNOWN_LABEL" || reason === "UNSUPPORTED_FOR_CATEGORY") {
    return t("products.kaspiReasonUnsupported");
  }
  if (reason === "BRAND_COUNTRY_MISMATCH") {
    return t("products.kaspiReasonBrandCountryMismatch");
  }
  if (reason === "AMBIGUOUS_VALUE" || reason === "DUPLICATE_CONFLICT") {
    return t("products.kaspiReasonAmbiguous");
  }
  if (reason === "INVALID_VALUE") {
    return t("products.kaspiReasonInvalid");
  }
  return t("products.kaspiReasonUnresolved");
}

export function isValidKaspiProductUrl(raw: string) {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:"
      && (url.hostname === "kaspi.kz" || url.hostname === "www.kaspi.kz")
      && (url.port === "" || url.port === "443")
      && url.username === ""
      && url.password === ""
      && url.pathname.startsWith("/shop/p/")
      && url.pathname.length > "/shop/p/".length;
  } catch {
    return false;
  }
}
