"use client";

import {ButtonHTMLAttributes, PropsWithChildren} from "react";

import {useCustomerRequestDialog} from "@/components/CustomerRequestDialog/CustomerRequestDialogProvider";

type CustomerRequestButtonProps = PropsWithChildren<{
    source: string;
    title?: "request" | "question";
    message?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>>;

export default function CustomerRequestButton({
    children,
    message,
    onClick,
    source,
    title = "request",
    type = "button",
    ...props
}: CustomerRequestButtonProps) {
    const {openCustomerRequest} = useCustomerRequestDialog();

    return (
        <button
            type={type}
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                    openCustomerRequest({source, title, message});
                }
            }}
            {...props}
        >
            {children}
        </button>
    );
}
