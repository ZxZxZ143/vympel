"use client";

import React from "react";
import {Controller, type Control, type FieldPath, type FieldValues} from "react-hook-form";
import {Search} from "lucide-react";
import {cn} from "@/lib/utils";

type TextInputProps<T extends FieldValues> = {
    control: Control<T>;
    name: FieldPath<T>;

    label?: string;
    placeholder?: string;

    variant?: "default" | "search";
    disabled?: boolean;

    className?: string;
    inputClassName?: string;

    type?: React.HTMLInputTypeAttribute;

    formId?: string;
    searchAriaLabel?: string;
};

export function TextInput<T extends FieldValues>({
                                                     control,
                                                     name,

                                                     label,
                                                     placeholder,

                                                     variant = "default",
                                                     disabled,
                                                     className,
                                                     inputClassName,
                                                     type = "text",

                                                     formId,
                                                     searchAriaLabel,
                                                 }: TextInputProps<T>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({field, fieldState}) => {
                const hasError = !!fieldState.error?.message;

                return (
                    <div className={cn("flex flex-col gap-2", className)}>
                        {label && (
                            <span className="text-text-heading-secondary text-4xs">
                {label}
              </span>
                        )}

                        <label
                            className={cn(
                                "border border-border-default rounded-full px-4 py-3 flex items-center gap-x-2.5 text-xs transition duration-100",
                                "focus-within:[&_svg]:text-text-primary/90 focus-within:border-text-primary",
                                disabled && "opacity-60 cursor-not-allowed",
                                {"border-error": hasError && variant === "default"},
                            )}
                        >
                            {variant === "search" && (
                                <button
                                    type="submit"
                                    form={formId}
                                    disabled={disabled}
                                    aria-label={searchAriaLabel ?? placeholder ?? label}
                                    className={cn(
                                        "shrink-0 inline-flex items-center justify-center cursor-pointer",
                                        disabled && "pointer-events-none"
                                    )}
                                >
                                    <Search className="h-5 w-5 text-text-muted transition duration-100"/>
                                </button>
                            )}
                            <input
                                {...field}
                                type={type}
                                disabled={disabled}
                                placeholder={placeholder}
                                className={cn(
                                    "w-full text-text-input-primary bg-transparent placeholder:text-text-placeholder outline-none",
                                    {"text-error": hasError && variant === "default"},
                                    inputClassName
                                )}
                            />
                        </label>

                        {hasError && variant !== "search" && (
                            <span className="text-error text-5xs pl-2">
                {fieldState.error?.message}
              </span>
                        )}
                    </div>
                );
            }}
        />
    );
}

export default TextInput;
