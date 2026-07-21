"use client";

import {KeyboardEvent, ReactNode, useEffect, useId, useMemo, useRef, useState} from "react";
import {Check, ChevronDown} from "lucide-react";

import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";

export type DropdownSelectOption<TValue extends string> = {
    value: TValue;
    label: string;
    disabled?: boolean;
};

type DropdownSelectProps<TValue extends string> = {
    id: string;
    label: ReactNode;
    value: TValue;
    options: DropdownSelectOption<TValue>[];
    onChange: (value: TValue) => void;
    className?: string;
    disabled?: boolean;
};

const DropdownSelect = <TValue extends string,>({
                                                   id,
                                                   label,
                                                   value,
                                                   options,
                                                   onChange,
                                                   className,
                                                   disabled = false,
                                               }: DropdownSelectProps<TValue>) => {
    const generatedId = useId();
    const labelId = `${id || generatedId}-label`;
    const listboxId = `${id || generatedId}-listbox`;
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const listboxRef = useRef<HTMLUListElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setOpen] = useState(false);
    const selectedIndex = useMemo(
        () => options.findIndex((option) => option.value === value),
        [options, value]
    );
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];
    const [activeIndex, setActiveIndex] = useState(selectedIndex);
    const activeOptionId = isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

    const closeDropdown = () => {
        setOpen(false);
    };

    const openDropdown = () => {
        setActiveIndex(preferredActiveIndex(options, selectedIndex));
        setOpen(true);
    };

    const selectOption = (index: number) => {
        const option = options[index];

        if (!option || option.disabled) {
            return;
        }

        onChange(option.value);
        setOpen(false);
        buttonRef.current?.focus();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        window.requestAnimationFrame(() => {
            listboxRef.current?.focus();
        });
    }, [isOpen]);

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openDropdown();
        }
    };

    const handleListboxKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            buttonRef.current?.focus();
            return;
        }

        if (event.key === "Tab") {
            setOpen(false);
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => nextEnabledOptionIndex(options, current, 1));
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => nextEnabledOptionIndex(options, current, -1));
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            setActiveIndex(firstEnabledOptionIndex(options));
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            setActiveIndex(lastEnabledOptionIndex(options));
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectOption(activeIndex);
        }
    };

    return (
        <div ref={rootRef} className={cn("relative grid min-w-[min(100%,13rem)] flex-1 gap-2 sm:flex-none", className)}>
            <Text id={labelId} as="span" size="caption" weight="medium">
                {label}
            </Text>

            <button
                ref={buttonRef}
                id={id}
                type="button"
                aria-labelledby={`${labelId} ${id}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                disabled={disabled}
                onClick={() => (isOpen ? closeDropdown() : openDropdown())}
                onKeyDown={handleTriggerKeyDown}
                className={cn(
                    "group flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-full",
                    "border border-border-default bg-dropdown-surface px-4 py-2.5 text-left text-2xs text-text-heading-secondary shadow-dropdown-trigger backdrop-blur-md",
                    "transition-vympel-fast hover:border-text-muted hover:bg-dropdown-surface-hover hover:text-text-heading-primary",
                    "focus:outline-none focus-visible:border-text-heading-secondary focus-visible:ring-2 focus-visible:ring-text-heading-primary/15",
                    "disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
                )}
            >
                <span className="min-w-0 flex-1 truncate leading-tight">
                    {selectedOption?.label ?? ""}
                </span>
                <span
                    aria-hidden="true"
                    className={cn(
                        "flex size-7 items-center justify-center rounded-full border border-border-default/70 bg-bg-lang-card/70 text-text-heading-secondary shadow-sm",
                        "transition-vympel-fast group-hover:bg-bg-lang-card group-focus-visible:bg-bg-lang-card",
                        isOpen && "rotate-180"
                    )}
                >
                    <ChevronDown className="size-4 stroke-[1.7]"/>
                </span>
            </button>

            {isOpen ? (
                <ul
                    ref={listboxRef}
                    id={listboxId}
                    role="listbox"
                    tabIndex={-1}
                    aria-labelledby={labelId}
                    aria-activedescendant={activeOptionId}
                    onKeyDown={handleListboxKeyDown}
                    className={cn(
                        "catalog-filter-scroll absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-72 w-full min-w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl",
                        "border border-border-default bg-dropdown-surface/95 p-1.5 text-text-heading-secondary shadow-dropdown-panel backdrop-blur-xl outline-none",
                        "transition-vympel motion-reduce:transition-none"
                    )}
                >
                    {options.map((option, index) => {
                        const isSelected = option.value === value;
                        const isActive = activeIndex === index;

                        return (
                            <li
                                key={option.value}
                                id={`${listboxId}-option-${index}`}
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={option.disabled}
                                onClick={() => selectOption(index)}
                                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                                className={cn(
                                    "flex min-h-10 cursor-pointer select-none items-center justify-between gap-4 rounded-xl px-3.5 py-2 text-2xs leading-snug transition-vympel-fast",
                                    "hover:bg-dropdown-surface-hover hover:text-text-heading-primary",
                                    isActive && "bg-dropdown-surface-hover text-text-heading-primary",
                                    isSelected && "bg-surface-card text-text-heading-primary shadow-sm",
                                    option.disabled && "cursor-not-allowed text-text-muted opacity-55 hover:bg-transparent"
                                )}
                            >
                                <span className="min-w-0 truncate whitespace-nowrap pr-2">
                                    {option.label}
                                </span>
                                <Check
                                    aria-hidden="true"
                                    className={cn(
                                        "size-4 stroke-[1.8] transition-vympel-fast",
                                        isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

export default DropdownSelect;

function preferredActiveIndex<TValue extends string>(
    options: DropdownSelectOption<TValue>[],
    selectedIndex: number
) {
    if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
        return selectedIndex;
    }

    return firstEnabledOptionIndex(options);
}

function firstEnabledOptionIndex<TValue extends string>(options: DropdownSelectOption<TValue>[]) {
    return options.findIndex((option) => !option.disabled);
}

function lastEnabledOptionIndex<TValue extends string>(options: DropdownSelectOption<TValue>[]) {
    for (let index = options.length - 1; index >= 0; index -= 1) {
        if (!options[index]?.disabled) {
            return index;
        }
    }

    return -1;
}

function nextEnabledOptionIndex<TValue extends string>(
    options: DropdownSelectOption<TValue>[],
    currentIndex: number,
    direction: 1 | -1
) {
    if (!options.length) {
        return -1;
    }

    let nextIndex = currentIndex;

    for (let step = 0; step < options.length; step += 1) {
        nextIndex = (nextIndex + direction + options.length) % options.length;

        if (!options[nextIndex]?.disabled) {
            return nextIndex;
        }
    }

    return currentIndex;
}
