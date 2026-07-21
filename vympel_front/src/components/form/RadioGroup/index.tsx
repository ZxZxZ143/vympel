"use client";

import {Control, Controller, FieldValues, Path} from "react-hook-form";
import {cn} from "@/lib/utils";
import {Text} from "@/components/ui/shared/text";

type RadioOption<TValue extends string> = {
    label: string;
    value: TValue;
};

type FormRadioGroupProps<
    TFieldValues extends FieldValues,
    TValue extends string
> = {
    name: Path<TFieldValues>;
    control: Control<TFieldValues>;
    options: RadioOption<TValue>[];
    className?: string;
    direction?: "row" | "column";
    onValueChange?: (value: TValue) => void;
};

export function RadioGroup<
    TFieldValues extends FieldValues,
    TValue extends string
>({
      name,
      control,
      options,
      className = "",
      direction = "row",
      onValueChange,
  }: FormRadioGroupProps<TFieldValues, TValue>) {
    return (
        <Controller
            name={name}
            control={control}
            render={({field}) => (
                <div
                    className={cn("flex",
                        {"flex-row flex-wrap gap-x-21 gap-y-8": direction === "row"},
                        {"flex-col gap-4": direction === "column"},
                        className
                    )}
                >
                    {options.map((option) => {
                        const checked = field.value === option.value;

                        return (
                            <label
                                key={option.value}
                                className="group flex min-h-11 min-w-0 cursor-pointer select-none items-center gap-4.5"
                            >
                                <input
                                    type="radio"
                                    value={option.value}
                                    checked={checked}
                                    onChange={() => {
                                        field.onChange(option.value);
                                        onValueChange?.(option.value);
                                    }}
                                    className="sr-only"
                                />

                                <span
                                    className={cn(
                                        "flex h-6 w-6 items-center justify-center rounded-full border transition group-hover:border-radio-checked",
                                        {"border-radio-checked": checked},
                                        {"border-radio-unchecked": !checked}
                                    )}>
                                        <span
                                            className={cn(
                                                "h-1/2 w-1/2 rounded-full transition group-hover:bg-radio-checked",
                                                {"bg-radio-checked": checked},
                                                {"bg-transparent": !checked}
                                            )}
                                        />
                                </span>

                                <Text size="bodySm" className="product-long-copy leading-snug">{option.label}</Text>
                            </label>
                        );
                    })}
                </div>
            )}
        />
    );
}
