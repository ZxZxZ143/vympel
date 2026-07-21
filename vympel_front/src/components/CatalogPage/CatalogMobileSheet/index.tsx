"use client";

import {type PropsWithChildren, useSyncExternalStore} from "react";
import {Dialog as DialogPrimitive} from "radix-ui";

import {cn} from "@/lib/utils";

type Props = PropsWithChildren<{
    className?: string;
    open: boolean;
    title: string;
    variant?: "sheet" | "full";
    onOpenChange: (open: boolean) => void;
}>;

export default function CatalogMobileSheet({
    children,
    className,
    open,
    title,
    variant = "sheet",
    onOpenChange,
}: Props) {
    const isMobile = useIsMobileViewport();

    return (
        <DialogPrimitive.Root open={open && isMobile} onOpenChange={onOpenChange} modal>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-[1000] bg-black/35 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none lg:hidden"
                />
                <DialogPrimitive.Content
                    className={cn(
                        "fixed z-[1010] flex min-h-0 flex-col overflow-hidden border border-border-default bg-primary-bg shadow-state outline-none",
                        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8 motion-reduce:animate-none lg:hidden",
                        variant === "sheet" && "inset-x-0 bottom-0 max-h-[min(88dvh,760px)] rounded-t-3xl",
                        variant === "full" && "inset-0 h-[100dvh] max-h-[100dvh] rounded-none border-0",
                        className
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

export function useIsMobileViewport() {
    return useSyncExternalStore(subscribeToMobileViewport, readMobileViewport, () => false);
}

function subscribeToMobileViewport(onChange: () => void) {
    const query = window.matchMedia("(max-width: 1023px)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function readMobileViewport() {
    return window.matchMedia("(max-width: 1023px)").matches;
}
