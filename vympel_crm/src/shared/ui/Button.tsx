import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cx } from "@/shared/utils/cx";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = PropsWithChildren<
  {
    variant?: ButtonVariant;
    isLoading?: boolean;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>;

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cx(
        "crm-button",
        variant === "secondary" && "crm-button--secondary",
        variant === "danger" && "crm-button--danger",
        className
      )}
      {...props}
    >
      <span className={cx(isLoading && "crm-button__label--loading")}>{children}</span>
      {isLoading ? <span className="crm-button__spinner" aria-hidden="true" /> : null}
    </button>
  );
}
