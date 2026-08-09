export function validateInstagramProfileUrl(value?: string | null): string | null {
    const raw = value?.trim();
    if (!raw) return null;
    try {
        const url = new URL(raw);
        const hostname = url.hostname.toLowerCase();
        if (url.protocol !== "https:" || (hostname !== "instagram.com" && hostname !== "www.instagram.com")) return null;
        if (url.username || url.password || url.search || url.hash) return null;
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length !== 1) return null;
        return `https://www.instagram.com/${encodeURIComponent(decodeURIComponent(segments[0]))}/`;
    } catch {
        return null;
    }
}

export const instagramProfileUrl = validateInstagramProfileUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL);
