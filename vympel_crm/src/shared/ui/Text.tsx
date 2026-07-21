import { HTMLAttributes, PropsWithChildren } from "react";
import { cx } from "@/shared/utils/cx";

type TextTone = "default" | "muted" | "inverse";
type TextSize = "body" | "small" | "caption";

type TextProps = PropsWithChildren<
  {
    as?: "p" | "span" | "div";
    tone?: TextTone;
    size?: TextSize;
  } & HTMLAttributes<HTMLElement>
>;

export function Text({
  as: Component = "p",
  tone = "default",
  size = "body",
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Component
      className={cx(
        "crm-text",
        tone === "muted" && "crm-text--muted",
        tone === "inverse" && "crm-text--inverse",
        size === "small" && "crm-text--small",
        size === "caption" && "crm-text--caption",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
