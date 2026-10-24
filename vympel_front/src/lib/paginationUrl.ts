/** One-based public URLs; API indices remain zero-based. */
export function positivePage(value: string | null): number {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function pageSearch(input: URLSearchParams, page: number): URLSearchParams {
    const params = new URLSearchParams(input);
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    params.delete("size");
    return params;
}

export function paginationHref(path: string, input: URLSearchParams, page: number, target?: string): string {
    const query = pageSearch(input, page).toString();
    return `${path}${query ? `?${query}` : ""}${target ? `#${target}` : ""}`;
}
