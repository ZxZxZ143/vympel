import React, {
    FC,
    PropsWithChildren,
    ButtonHTMLAttributes,
    ReactNode,
} from "react";
import {cn} from "@/lib/utils";
import {cva, VariantProps} from "class-variance-authority";
import Loader from "@/components/ui/shared/Loader";

export const variants = cva(
    "inline-flex items-center justify-center rounded-full border border-border-default transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-bg-action/40 disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                default:
                    "bg-button-bg-default hover:bg-button-bg-action/20 active:bg-button-bg-action/30",
                disabled: "bg-button-bg-action/30 opacity-60",
                action:
                    "bg-button-bg-action text-button-text-action hover:bg-button-bg-action/85 active:bg-button-bg-action/70",
                connectBanner:
                    "border-0 bg-connect-button-bg text-connect-button-text hover:bg-connect-button-bg/90 active:bg-connect-button-bg/80",
            },

            size: {
                sm: "px-6 py-2 text-sm",
                md: "px-9 py-3 text-sm",
                lg: "px-11 py-3 text-base",
                icon: "w-12 h-12 p-0",
                connectBanner: "px-connect-banner-button-x py-connect-banner-button-y",
            },
        },

        defaultVariants: {
            variant: "default",
            size: "lg",
        },
    }
);

type ButtonProps = {
    className?: string;
    isLoading?: boolean;

    iconLeft?: ReactNode;
    iconRight?: ReactNode;

    icon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof variants>;

const Button: FC<PropsWithChildren<ButtonProps>> = ({
                                                        variant = "default",
                                                        size = "lg",
                                                        className,
                                                        disabled = false,
                                                        isLoading = false,

                                                        icon,
                                                        iconLeft,
                                                        iconRight,
                                                        children,

                                                        type = "button",
                                                        ...props
                                                    }) => {
    const isIconOnly = Boolean(icon) && !children;
    const resolvedSize = isIconOnly ? "icon" : size;

    const isDisabled = disabled || isLoading;
    const finalVariant = isDisabled ? "disabled" : variant;

    const loaderSize =
        resolvedSize === "sm" ? "sm" : resolvedSize === "md" ? "md" : "lg";

    if (process.env.NODE_ENV !== "production" && isIconOnly && !props["aria-label"]) {
        console.warn('Button: icon-only Button should have aria-label');
    }

    return (
        <button
            type={type}
            disabled={isDisabled}
            className={cn(variants({variant: finalVariant, size: resolvedSize}), className)}
            {...props}
        >
      <span className="relative flex items-center justify-center leading-none">
          <span className={cn(isLoading && "opacity-0")}>
          {isIconOnly ? (
              <span
                  aria-hidden="true"
                  className="flex items-center justify-center"
              >
                {icon}
              </span>
          ) : (
              <span className="flex items-center justify-center">
              {iconLeft && <span className="mr-2 inline-flex">{iconLeft}</span>}
                  {children}
                  {iconRight && <span className="ml-2 inline-flex">{iconRight}</span>}
            </span>
          )}
        </span>

          {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
            <Loader size={loaderSize}/>
          </span>
          )}
      </span>
        </button>
    );
};

export default Button;
