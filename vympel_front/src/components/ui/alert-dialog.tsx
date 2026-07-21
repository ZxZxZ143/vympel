"use client";

import * as React from "react";
import {AlertDialog as AlertDialogPrimitive} from "radix-ui";
import {X} from "lucide-react";

import {cn} from "@/lib/utils";

function AlertDialog({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
    return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props}/>;
}

function AlertDialogTrigger({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
    return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props}/>;
}

function AlertDialogPortal({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
    return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props}/>;
}

function AlertDialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
    return (
        <AlertDialogPrimitive.Overlay
            data-slot="alert-dialog-overlay"
            className={cn(
                "fixed inset-0 z-[1000] bg-black/35 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
                className
            )}
            {...props}
        />
    );
}

function AlertDialogContent({
    className,
    children,
    closeLabel = "Close",
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
    closeLabel?: string;
    showCloseButton?: boolean;
}) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay/>
            <AlertDialogPrimitive.Content
                data-slot="alert-dialog-content"
                className={cn(
                    "fixed left-1/2 top-1/2 z-[1010] grid w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-6 rounded-2xl border border-border-default bg-primary-bg px-6 py-6 shadow-state outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:px-8 sm:py-7",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton ? (
                    <AlertDialogPrimitive.Cancel
                        aria-label={closeLabel}
                        data-slot="alert-dialog-close"
                        className="absolute right-6 top-6 inline-flex size-9 items-center justify-center rounded-full border-0 bg-transparent text-text-heading-secondary transition-vympel-fast hover:bg-surface-card hover:text-text-heading-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                    >
                        <X className="size-5" aria-hidden="true"/>
                        <span className="sr-only">{closeLabel}</span>
                    </AlertDialogPrimitive.Cancel>
                ) : null}
            </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return <div className={cn("grid gap-3 text-left", className)} {...props}/>;
}

function AlertDialogFooter({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
                className
            )}
            {...props}
        />
    );
}

function AlertDialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
    return (
        <AlertDialogPrimitive.Title
            data-slot="alert-dialog-title"
            className={cn("text-xl font-medium leading-tight text-text-heading-primary", className)}
            {...props}
        />
    );
}

function AlertDialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
    return (
        <AlertDialogPrimitive.Description
            data-slot="alert-dialog-description"
            className={cn("text-base font-light leading-7 text-text-primary", className)}
            {...props}
        />
    );
}

function AlertDialogAction({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
    return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" {...props}/>;
}

function AlertDialogCancel({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
    return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" {...props}/>;
}

export {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
