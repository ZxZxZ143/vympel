import { HTMLAttributes, PropsWithChildren } from "react";
import { cx } from "@/shared/utils/cx";

type HeadingLevel = "h1" | "h2" | "h3";
type HeadingSize = "display" | "section" | "title";

type HeadingProps = PropsWithChildren<
  {
    as?: HeadingLevel;
    size?: HeadingSize;
  } & HTMLAttributes<HTMLHeadingElement>
>;

export function Heading({
  as: Component = "h2",
  size = "section",
  className,
  children,
  ...props
}: HeadingProps) {
  return (
    <Component
      className={cx(
        "crm-heading",
        size === "display" && "crm-heading--display",
        size === "section" && "crm-heading--section",
        size === "title" && "crm-heading--title",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
