import {readSiteIndexingPolicy} from "../../site-indexing.mjs";

export type SiteIndexingPolicy =
    | {enabled: false}
    | {enabled: true; approvedOrigin: string};

export function siteIndexingPolicy(): SiteIndexingPolicy {
    return readSiteIndexingPolicy(process.env) as SiteIndexingPolicy;
}

export function isSiteIndexingEnabled(): boolean {
    return siteIndexingPolicy().enabled;
}
