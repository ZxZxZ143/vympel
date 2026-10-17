"use client";

import {useEffect, useId, useRef, useState, type KeyboardEvent} from "react";
import {createPortal} from "react-dom";
import type {Feature} from "@/shared/api/types";
import {useI18n} from "@/shared/i18n/useI18n";
import {ActionIcon} from "@/shared/ui/ActionIcon";
import type {ReferenceDeletionActions} from "./referenceDeletion";

type Props = {
  id: string;
  label: string;
  options: Feature[];
  placeholder: string;
  displayLabels?: Record<string, string>;
  disabled?: boolean;
  deletion?: ReferenceDeletionActions;
} & ({multiple?: false; value: string; onChange: (value: string) => void}
  | {multiple: true; value: string[]; onChange: (value: string[]) => void});

export function ReferenceOptionPicker(props: Props) {
  const {id, label, options, placeholder, displayLabels, disabled, deletion} = props;
  const {t} = useI18n();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visible = open && !disabled;
  const displayName = (option: Feature) => (option.code && displayLabels?.[option.code]) || option.name;
  const selectedIds = new Set(props.multiple ? props.value : [props.value]);
  const selectedText = options.filter((option) => selectedIds.has(String(option.id))).map(displayName).join(", ");
  const filtered = options.filter((option) => displayName(option).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  useEffect(() => {
    if (!visible) return;
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const position = () => {
      const rect = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const leftEdge = (viewport?.offsetLeft ?? 0) + 8;
      const topEdge = (viewport?.offsetTop ?? 0) + 8;
      const rightEdge = leftEdge + (viewport?.width ?? document.documentElement.clientWidth) - 16;
      const bottomEdge = topEdge + (viewport?.height ?? window.innerHeight) - 16;
      const below = bottomEdge - rect.bottom - 6;
      const above = rect.top - topEdge - 6;
      const upwards = below < 260 && above > below;
      const width = Math.min(rect.width, rightEdge - leftEdge);
      panel.style.width = `${width}px`;
      panel.style.left = `${Math.max(leftEdge, Math.min(rect.left, rightEdge - width))}px`;
      panel.style.maxHeight = `${Math.max(0, Math.min(320, upwards ? above : below))}px`;
      const height = panel.getBoundingClientRect().height;
      panel.style.top = `${Math.max(topEdge, Math.min(upwards ? rect.top - height - 6 : rect.bottom + 6, bottomEdge - height))}px`;
      panel.style.visibility = "visible";
    };
    position();
    searchRef.current?.focus({preventScroll: true});
    const dismiss = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest('[aria-modal="true"]')) return;
      if (!rootRef.current?.contains(target) && !panel.contains(target)) setOpen(false);
    };
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(position);
    observer?.observe(trigger);
    observer?.observe(panel);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [visible]);

  const show = () => { setQuery(""); setOpen(true); };
  const close = () => { setOpen(false); triggerRef.current?.focus({preventScroll: true}); };
  const select = (next: string) => {
    if (props.multiple) props.onChange(props.value.includes(next) ? props.value.filter((value) => value !== next) : [...props.value, next]);
    else { props.onChange(next); close(); }
  };
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === "Tab") {
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('input, button:not([disabled])') ?? []);
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); close(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        // Let native Tab continue from the trigger into the form, not from the portal at the end of body.
        close();
      }
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    if (event.target === searchRef.current && ["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>("[data-reference-choice]") ?? []);
    if (!buttons.length) return;
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : event.key === "ArrowDown" ? (index + 1) % buttons.length : (index <= 0 ? buttons.length - 1 : index - 1);
    buttons[next].focus();
  };

  return <div ref={rootRef} className="crm-reference-picker">
    <button ref={triggerRef} id={id} type="button" className="crm-select crm-reference-picker__trigger"
      title={selectedText || placeholder} disabled={disabled} aria-haspopup="dialog" aria-expanded={visible} aria-controls={visible ? panelId : undefined}
      onClick={() => visible ? close() : show()} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); } }}>
      <span>{selectedText || placeholder}</span><ActionIcon name="chevron"/>
    </button>
    {visible ? createPortal(<div ref={panelRef} id={panelId} role="dialog" aria-label={label} className="crm-reference-picker__panel" onKeyDown={navigate}>
      <input ref={searchRef} type="search" className="crm-input" aria-label={`${t("common.search")}: ${label}`} placeholder={t("common.search")} value={query} onChange={(event) => setQuery(event.target.value)}/>
      <ul className="crm-reference-picker__options">
        {!props.multiple ? <li><button type="button" data-reference-choice="" className="crm-reference-picker__choice" aria-pressed={props.value === ""} onClick={() => select("")}>{placeholder}</button></li> : null}
        {filtered.map((option) => <li key={option.id} className="crm-reference-picker__row">
          <button type="button" data-reference-choice={option.id} className="crm-reference-picker__choice" aria-pressed={selectedIds.has(String(option.id))} onClick={() => select(String(option.id))}>
            <span>{displayName(option)}</span>{selectedIds.has(String(option.id)) ? <ActionIcon name="save"/> : null}
          </button>
          {deletion?.canDelete(option) ? <button type="button" className="crm-reference-delete" aria-label={`${t("catalogTools.deleteOption")}: ${displayName(option)}`} title={t("catalogTools.deleteOption")}
            onClick={() => { triggerRef.current?.focus({preventScroll: true}); deletion.requestDelete(option); }}><ActionIcon name="trash"/></button> : null}
        </li>)}
        {filtered.length === 0 ? <li className="crm-reference-picker__empty" role="status">{t("products.referenceNoOptions")}</li> : null}
      </ul>
    </div>, document.body) : null}
  </div>;
}
