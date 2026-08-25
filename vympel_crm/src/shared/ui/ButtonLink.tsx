import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

import { buttonClassName, type ButtonVariant } from "@/shared/ui/Button";

type ButtonLinkProps = PropsWithChildren<
  LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    variant?: ButtonVariant;
    disabled?: boolean;
  }
>;

export function ButtonLink({
  variant = "primary",
  disabled = false,
  className,
  children,
  onClick,
  tabIndex,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={buttonClassName(variant, className)}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      <span>{children}</span>
    </Link>
  );
}
