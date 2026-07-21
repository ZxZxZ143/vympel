"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

type Props = {
    children: React.ReactNode;
};

function NProgressEvents() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const firstRenderRef = useRef(true);

    useEffect(() => {
        NProgress.configure({
            showSpinner: false,
            minimum: 0.08,
            trickleSpeed: 120,
        });
    }, []);

    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }

        NProgress.done();
    }, [pathname, searchParams]);

    return null;
}

export default function NProgressProvider({ children }: Props) {
    return (
        <>
            <Suspense fallback={null}>
                <NProgressEvents />
            </Suspense>
            {children}
        </>
    );
}
