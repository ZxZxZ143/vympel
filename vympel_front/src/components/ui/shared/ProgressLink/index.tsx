"use client";

import type {ComponentProps, ReactNode} from "react";

import {Link} from "@/i18n/navigation";

type Props = ComponentProps<typeof Link> & {
    children: ReactNode;
};

export default function ProgressLink({
                                         children,
                                         onClick,
                                         ...props
                                     }: Props) {
    return (
        <Link
            {...props}
            onClick={onClick}
        >
            {children}
        </Link>
    );
}
