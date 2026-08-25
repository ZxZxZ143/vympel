"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/shared/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel?: string;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  isLoading = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const loadingRef = useRef(isLoading);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
    loadingRef.current = isLoading;
  }, [isLoading, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
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
    cancelRef.current?.focus();

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loadingRef.current) {
        onOpenChangeRef.current(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="crm-confirm-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onOpenChange(false);
        }
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="crm-confirm-dialog"
        role="alertdialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          aria-label={closeLabel ?? cancelLabel}
          className="crm-confirm-dialog__close"
          disabled={isLoading}
          type="button"
          onClick={() => onOpenChange(false)}
        >
          x
        </button>

        <div className="crm-confirm-dialog__body">
          <h2 className="crm-confirm-dialog__title" id={titleId}>
            {title}
          </h2>
          {description ? (
            <p className="crm-confirm-dialog__description" id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>

        <div className="crm-confirm-dialog__actions">
          <Button ref={cancelRef} variant="secondary" disabled={isLoading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant="danger" isLoading={isLoading} onClick={() => void onConfirm()}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
