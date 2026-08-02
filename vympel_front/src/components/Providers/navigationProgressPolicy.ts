export type NavigationIntent = {
    currentUrl: string;
    href: string;
    defaultPrevented?: boolean;
    button?: number;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    target?: string | null;
    download?: boolean;
};

export function shouldStartNavigationProgress({
    currentUrl,
    href,
    defaultPrevented = false,
    button = 0,
    metaKey = false,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    target,
    download = false,
}: NavigationIntent): boolean {
    if (
        defaultPrevented ||
        button !== 0 ||
        metaKey ||
        ctrlKey ||
        shiftKey ||
        altKey ||
        download
    ) {
        return false;
    }

    const normalizedTarget = target?.trim().toLowerCase();
    if (normalizedTarget && normalizedTarget !== "_self") {
        return false;
    }

    try {
        const current = new URL(currentUrl);
        const destination = new URL(href, current);

        if (!["http:", "https:"].includes(destination.protocol)) {
            return false;
        }

        if (destination.origin !== current.origin) {
            return false;
        }

        return !(
            destination.pathname === current.pathname &&
            destination.search === current.search
        );
    } catch {
        return false;
    }
}
