import { PropsWithChildren } from "react";

type FieldProps = PropsWithChildren<{
  label: string;
  htmlFor: string;
  error?: string;
}>;

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <label className="crm-field" htmlFor={htmlFor}>
      <span className="crm-label">{label}</span>
      {children}
      {error && <span className="crm-form-error">{error}</span>}
    </label>
  );
}
