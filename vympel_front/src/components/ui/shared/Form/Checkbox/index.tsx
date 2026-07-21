"use client";

import {InputHTMLAttributes} from "react";
import {Check} from "lucide-react";

import {cn} from "@/lib/utils";

type CheckboxProps = {
    label: string;
    count?: number;
    checked: boolean;
    disabled?: boolean;
    onCheckedChange: (checked: boolean) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "checked" | "disabled" | "onChange" | "type">;

const Checkbox = ({
    label,
    count,
    checked,
    disabled = false,
    onCheckedChange,
    className,
    ...props
}: CheckboxProps) => {
    return (
        <label
            className={cn(
                "catalog-hover-trigger flex cursor-pointer select-none items-center",
                "gap-catalog-filter-checkbox-label-gap text-xs text-catalog-filter-option transition-vympel-fast motion-reduce:transition-none",
                disabled && "cursor-not-allowed text-catalog-filter-disabled",
                className
            )}
        >
            <input
                {...props}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onCheckedChange(event.target.checked)}
                className="peer sr-only"
            />
            <span
                aria-hidden="true"
                className={cn(
                    "flex size-5 items-center justify-center border border-catalog-filter-option transition-vympel-fast peer-focus-visible:ring-2 peer-focus-visible:ring-text-heading-primary/30 motion-reduce:transition-none",
                    disabled && "border-catalog-filter-disabled",
                    checked && !disabled && "bg-catalog-filter-option text-primary-bg"
                )}
            >
                <Check
                    className={cn(
                        "size-3.5 transition-vympel-fast motion-reduce:transition-none",
                        checked ? "scale-100 opacity-100" : "scale-75 opacity-0"
                    )}
                    strokeWidth={2}
                />
            </span>
            <span className="catalog-hover-label min-w-0" data-disabled={disabled ? "true" : undefined}>
                {label}
                {typeof count === "number" && (
                    <span className="ml-1 text-catalog-filter-disabled">({count})</span>
                )}
            </span>
        </label>
    );
};

export default Checkbox;
