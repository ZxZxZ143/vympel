"use client";

import { FormEvent, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import type { Feature, ReferenceCreateType } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { Text } from "@/shared/ui/Text";

export type ReferenceCreateTarget = {
  type: ReferenceCreateType;
  title: string;
  onCreated: (option: Feature) => void;
};

type CreatableReferenceSelectProps = {
  id: string;
  label: string;
  value: string;
  options: Feature[];
  placeholder: string;
  displayLabels?: Record<string, string>;
  disabled?: boolean;
  onChange: (value: string) => void;
  onAdd?: () => void;
};

export function CreatableReferenceSelect({
  id,
  label,
  value,
  options,
  placeholder,
  displayLabels,
  disabled = false,
  onChange,
  onAdd,
}: CreatableReferenceSelectProps) {
  const { t } = useI18n();
  return (
    <Field htmlFor={id} label={label}>
      <div className="crm-creatable-reference">
        <select
          id={id}
          className="crm-select"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.code && displayLabels?.[option.code] ? displayLabels[option.code] : option.name}
            </option>
          ))}
        </select>
        {onAdd ? (
          <Button type="button" variant="secondary" className="crm-button--compact" disabled={disabled} onClick={onAdd}>
            {t("products.referenceAdd")}
          </Button>
        ) : null}
      </div>
    </Field>
  );
}

type CreatableReferenceMultiSelectProps = {
  id: string;
  label: string;
  value: string[];
  options: Feature[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
  onAdd?: () => void;
};

export function CreatableReferenceMultiSelect({
  id,
  label,
  value,
  options,
  disabled = false,
  onChange,
  onAdd,
}: CreatableReferenceMultiSelectProps) {
  const { t } = useI18n();
  const selected = new Set(value);
  return (
    <fieldset className="crm-reference-multi" id={id} disabled={disabled}>
      <legend>{label}</legend>
      <div className="crm-reference-multi__options">
        {options.map((option) => {
          const optionId = String(option.id);
          return (
            <label key={option.id} className="crm-reference-multi__option">
              <input
                type="checkbox"
                checked={selected.has(optionId)}
                onChange={(event) => {
                  const next = new Set(value);
                  if (event.target.checked) next.add(optionId);
                  else next.delete(optionId);
                  onChange(Array.from(next));
                }}
              />
              <span>{option.name}</span>
            </label>
          );
        })}
        {options.length === 0 ? <Text tone="muted" size="small">{t("products.referenceNoOptions")}</Text> : null}
      </div>
      {onAdd ? (
        <Button type="button" variant="secondary" className="crm-button--compact" disabled={disabled} onClick={onAdd}>
          {t("products.referenceAdd")}
        </Button>
      ) : null}
    </fieldset>
  );
}

export function ReferenceCreateDialog({
  target,
  onClose,
}: {
  target: ReferenceCreateTarget | null;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  const [ru, setRu] = useState("");
  const [kz, setKz] = useState("");
  const [en, setEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const ruInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(saving);
  const onCloseRef = useRef(onClose);
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  const closeDialog = useCallback(() => {
    setRu("");
    setKz("");
    setEn("");
    setError(null);
    setSaving(false);
    savingRef.current = false;
    onClose();
  }, [onClose]);

  useEffect(() => {
    savingRef.current = saving;
    onCloseRef.current = closeDialog;
  }, [closeDialog, saving]);

  useEffect(() => {
    if (!target) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const background = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlayRef.current)
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
      }));
    background.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    ruInputRef.current?.focus();

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
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
      document.body.style.overflow = previousOverflow;
      background.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      previousFocus?.focus();
    };
  }, [target]);

  if (!target || !mounted) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (savingRef.current) return;
    if (!ru.trim()) {
      setError(t("products.referenceRequired"));
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const created = await crmApi.createReference(target.type, { ru, kz, en }, locale);
      target.onCreated(created);
      closeDialog();
    } catch (caught) {
      setError(getCrmErrorMessage(caught, t("products.referenceCreateError"), undefined, {
        REFERENCE_DUPLICATE: t("products.referenceDuplicate"),
        VALIDATION_ERROR: t("products.referenceValidationError"),
        BAD_REQUEST: t("products.referenceValidationError"),
      }));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="crm-confirm-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) closeDialog();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-modal="true"
        className="crm-confirm-dialog crm-reference-dialog"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          aria-label={t("common.cancel")}
          className="crm-confirm-dialog__close"
          disabled={saving}
          type="button"
          onClick={closeDialog}
        >
          x
        </button>
        <form onSubmit={submit}>
          <div className="crm-confirm-dialog__body crm-grid">
            <h2 className="crm-confirm-dialog__title" id={titleId}>
              {t("products.referenceCreateTitle").replace("{name}", target.title)}
            </h2>
            <Text tone="muted" size="small">{t("products.referenceLocaleHint")}</Text>
            <Field htmlFor="referenceNameRu" label={t("products.referenceNameRu")}>
              <input ref={ruInputRef} id="referenceNameRu" className="crm-input" maxLength={100} value={ru} onChange={(event) => setRu(event.target.value)} />
            </Field>
            <Field htmlFor="referenceNameKz" label={t("products.referenceNameKz")}>
              <input id="referenceNameKz" className="crm-input" maxLength={100} value={kz} onChange={(event) => setKz(event.target.value)} />
            </Field>
            <Field htmlFor="referenceNameEn" label={t("products.referenceNameEn")}>
              <input id="referenceNameEn" className="crm-input" maxLength={100} value={en} onChange={(event) => setEn(event.target.value)} />
            </Field>
            {error ? <Text className="crm-form-error">{error}</Text> : null}
          </div>
          <div className="crm-confirm-dialog__actions">
            <Button type="button" variant="secondary" disabled={saving} onClick={closeDialog}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={saving} disabled={saving}>
              {t("products.referenceCreate")}
            </Button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}

export function mergeReferenceOption(options: Feature[], created: Feature) {
  return [...options.filter((option) => option.id !== created.id), created]
    .sort((left, right) => left.name.localeCompare(right.name));
}
