"use client";

import {createElement, forwardRef, type ComponentProps} from "react";
import {createNavigation} from "next-intl/navigation";

import {startNavigationProgress} from "@/components/Providers/navigationProgressController";
import {shouldStartNavigationProgress} from "@/components/Providers/navigationProgressPolicy";
import {routing} from "./routing";

const navigation = createNavigation(routing);

type LinkProps = ComponentProps<typeof navigation.Link>;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
    {onClick, ...props},
    ref,
) {
    return createElement(navigation.Link, {
        ...props,
        ref,
        onClick: (event) => {
            onClick?.(event);

            if (shouldStartNavigationProgress({
                currentUrl: window.location.href,
                href: event.currentTarget.href,
                defaultPrevented: event.defaultPrevented,
                button: event.button,
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                target: event.currentTarget.target,
                download: event.currentTarget.hasAttribute("download"),
            })) {
                startNavigationProgress();
            }
        },
    });
});

export const useRouter = navigation.useRouter;
export const usePathname = navigation.usePathname;
