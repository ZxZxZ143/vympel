const TRUE = "true";
const FALSE = "false";

/**
 * Reads the server-owned release switch that authorizes search indexing.
 * A canonical origin is still required by the SEO layer for URL construction,
 * but it never grants indexing permission by itself.
 *
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} env
 */
export function readSiteIndexingPolicy(env = process.env) {
    const rawValue = env.SITE_INDEXING_ENABLED?.trim().toLowerCase();

    if (rawValue == null || rawValue === "" || rawValue === FALSE) {
        return {enabled: false};
    }

    if (rawValue !== TRUE) {
        throw new Error("SITE_INDEXING_ENABLED must be exactly true or false");
    }

    const rawOrigin = env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!rawOrigin) {
        throw new Error("SITE_INDEXING_ENABLED=true requires NEXT_PUBLIC_SITE_URL");
    }

    let origin;
    try {
        origin = new URL(rawOrigin);
    } catch {
        throw new Error("SITE_INDEXING_ENABLED=true requires an absolute HTTPS NEXT_PUBLIC_SITE_URL");
    }

    if (
        origin.protocol !== "https:"
        || origin.username
        || origin.password
        || origin.search
        || origin.hash
        || (origin.pathname !== "/" && origin.pathname !== "")
    ) {
        throw new Error("SITE_INDEXING_ENABLED=true requires an origin-only HTTPS NEXT_PUBLIC_SITE_URL");
    }

    return {enabled: true, approvedOrigin: origin.origin};
}
