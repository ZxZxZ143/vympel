import type {ICmsBlock} from "@/api/types/CmsTypes";
import {cmsImageUrl, findCmsBlocksByType} from "@/utils/cmsContent";
import {canonicalInstagramPostUrl} from "@/utils/instagramPostUrl";

export type AboutInstagramPost = {
    id: string;
    src: string;
    alt: string;
    href: string | null;
};

const fallbackSources = [
    "/insta-1.webp",
    "/insta-2.png",
    "/insta-3.webp",
    "/insta-4.webp",
] as const;

export function cmsAboutInstagramPosts(
    blocks: ICmsBlock[] | undefined,
    fallbackAlt: (position: number) => string
): AboutInstagramPost[] {
    return findCmsBlocksByType(blocks, "INSTAGRAM_POST")
        .reduce<AboutInstagramPost[]>((posts, block) => {
            const src = cmsImageUrl(block, "");
            const href = block.linkType === "EXTERNAL_URL"
                ? canonicalInstagramPostUrl(block.linkTarget)
                : null;
            if (!src || !href) {
                return posts;
            }

            posts.push({
                id: `cms-${block.id}`,
                src,
                alt: block.translation?.altText?.trim() || fallbackAlt(posts.length + 1),
                href,
            });
            return posts;
        }, []);
}

export function resolveAboutInstagramPosts(
    cmsPosts: AboutInstagramPost[],
    fallbackAlt: (position: number) => string
): AboutInstagramPost[] {
    if (cmsPosts.length > 0) {
        return cmsPosts;
    }

    return fallbackSources.map((src, index) => ({
        id: `fallback-${index + 1}`,
        src,
        alt: fallbackAlt(index + 1),
        href: null,
    }));
}
