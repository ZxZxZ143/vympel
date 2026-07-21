"use client";

import { useEffect, useId } from "react";

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

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isLoading, onOpenChange, open]);

  if (!open) return null;

  return (
    <div
      className="crm-confirm-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onOpenChange(false);
        }
      }}
    >
      <section
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
          <Button variant="secondary" disabled={isLoading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant="danger" isLoading={isLoading} onClick={() => void onConfirm()}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
