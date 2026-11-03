import staticImages from "@/generated/responsive-images.json";

const widths = [160, 320, 480, 800, 1200, 1600, 1920, 2560];
const family = /^(.*\/(product|cms)\/responsive-v1\/[a-f0-9-]{36}\/[a-f0-9]{64}\/([1-9][0-9]{0,4})x([1-9][0-9]{0,4}))\/original\.(?:png|jpe?g)$/;
type Candidate = {src: string; width: number};
type StaticImage = {width: number; height: number; variants: Candidate[]};
type ResponsiveImage = {src: string; srcSet?: string; width?: number; height?: number};

/** Legacy URLs remain originals. Only a completed, versioned family may advertise variants. */
export function responsiveImage(src: string, maximumWidth = 2560): ResponsiveImage {
    if (maximumWidth === 0) return {src}; // Explicit full-resolution viewing.
    const query = src.split("?", 2)[1]?.split("#", 1)[0];
    if (query && [...new URLSearchParams(query).keys()].some(key => key !== "v")) return {src};
    const path = src.split(/[?#]/, 1)[0];
    const local = (staticImages as Record<string, StaticImage>)[path];
    const match = family.exec(path);
    let candidates: Candidate[] = [];
    let width: number | undefined;
    let height: number | undefined;
    if (local) {
        ({width, height} = local);
        candidates = local.variants;
    } else if (match && (/^https?:\/\//.test(path) || path.startsWith("/"))) {
        width = Number(match[3]);
        height = Number(match[4]);
        if (width > 10000 || height > 10000 || width * height > 25000000) return {src};
        candidates = [...new Set(widths.filter(w => match[2] === "cms" || w <= 1600).map(w => Math.min(w, width!)))]
            .map(w => ({src: `${match[1]}/w${w}.webp`, width: w}));
    }
    const limited = candidates.filter(c => c.width <= maximumWidth);
    if (!limited.length && candidates.length) limited.push(candidates[0]);
    return {
        src: limited.find(c => c.width >= Math.min(800, maximumWidth))?.src ?? limited.at(-1)?.src ?? src,
        srcSet: limited.length ? limited.map(c => `${c.src} ${c.width}w`).join(", ") : undefined,
        width,
        height,
    };
}

export function nearbySlide(index: number, selected: number, count: number) {
    const distance = Math.abs(index - selected);
    return distance <= 1 || (count > 1 && distance === count - 1);
}

export const PRODUCT_CARD_SIZES = "(max-width: 639px) 44vw, (max-width: 1023px) 42vw, 320px";
export const PRODUCT_GALLERY_SIZES = "(max-width: 639px) 90vw, (max-width: 1023px) 65vw, 620px";
