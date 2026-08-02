"use client";

import {Suspense, useEffect} from "react";
import {usePathname, useSearchParams} from "next/navigation";

import {
    configureNavigationProgress,
    finishNavigationProgress,
    resetNavigationProgress,
    startNavigationProgress,
} from "@/components/Providers/navigationProgressController";

type Props = {
    children: React.ReactNode;
};

function NProgressEvents() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();

    useEffect(() => {
        const cleanupConfiguration = configureNavigationProgress();

        const handlePopState = () => startNavigationProgress();
        const handleNavigationFailure = () => finishNavigationProgress();

        window.addEventListener("popstate", handlePopState);
        window.addEventListener("error", handleNavigationFailure);
        window.addEventListener("unhandledrejection", handleNavigationFailure);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("error", handleNavigationFailure);
            window.removeEventListener("unhandledrejection", handleNavigationFailure);
            cleanupConfiguration();
            resetNavigationProgress();
        };
    }, []);

    useEffect(() => {
        finishNavigationProgress();
    }, [pathname, search]);

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
