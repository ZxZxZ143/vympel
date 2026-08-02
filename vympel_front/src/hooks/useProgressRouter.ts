"use client";

import {useMemo} from "react";
import {useRouter as useNextRouter} from "next/navigation";

import {
    usePathname as useIntlPathname,
    useRouter as useIntlRouter,
} from "@/i18n/navigation";
import {
    finishNavigationProgress,
    startNavigationProgress,
} from "@/components/Providers/navigationProgressController";
import {shouldStartNavigationProgress} from "@/components/Providers/navigationProgressPolicy";

function startForDestination(href: unknown, currentPathname?: string | null, force = false) {
    if (typeof window === "undefined") {
        return;
    }

    if (force || typeof href !== "string") {
        startNavigationProgress();
        return;
    }

    const currentUrl = new URL(window.location.href);
    if (currentPathname) {
        currentUrl.pathname = currentPathname;
    }

    if (shouldStartNavigationProgress({
        currentUrl: currentUrl.toString(),
        href,
    })) {
        startNavigationProgress();
    }
}

function finishOnSynchronousNavigationFailure<TResult>(navigate: () => TResult): TResult {
    try {
        return navigate();
    } catch (error) {
        finishNavigationProgress();
        throw error;
    }
}

export function useProgressRouter() {
    const router = useNextRouter();

    return useMemo(() => ({
        ...router,
        push: (...args: Parameters<typeof router.push>) => {
            startForDestination(args[0]);
            return finishOnSynchronousNavigationFailure(() => router.push(...args));
        },
        replace: (...args: Parameters<typeof router.replace>) => {
            startForDestination(args[0]);
            return finishOnSynchronousNavigationFailure(() => router.replace(...args));
        },
    }), [router]);
}

export function useProgressIntlRouter() {
    const router = useIntlRouter();
    const pathname = useIntlPathname();

    return useMemo(() => ({
        ...router,
        push: (...args: Parameters<typeof router.push>) => {
            const options = args[1] as {locale?: string} | undefined;
            startForDestination(args[0], pathname, Boolean(options?.locale));
            return finishOnSynchronousNavigationFailure(() => router.push(...args));
        },
        replace: (...args: Parameters<typeof router.replace>) => {
            const options = args[1] as {locale?: string} | undefined;
            startForDestination(args[0], pathname, Boolean(options?.locale));
            return finishOnSynchronousNavigationFailure(() => router.replace(...args));
        },
    }), [pathname, router]);
}
