import { ButtonHTMLAttributes, forwardRef, PropsWithChildren } from "react";
import { cx } from "@/shared/utils/cx";

export type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = PropsWithChildren<
  {
    variant?: ButtonVariant;
    isLoading?: boolean;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>;

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cx(
    "crm-button",
    variant === "secondary" && "crm-button--secondary",
    variant === "danger" && "crm-button--danger",
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={buttonClassName(variant, className)}
      {...props}
    >
      <span className={cx(isLoading && "crm-button__label--loading")}>{children}</span>
      {isLoading ? <span className="crm-button__spinner" aria-hidden="true" /> : null}
    </button>
  );
});
