import {createHash} from "node:crypto";
import {mkdir, readdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const output = path.join(publicRoot, "image-variants", "v1");
await mkdir(output, {recursive: true});
sharp.concurrency(1);
sharp.cache(false);
const manifest = {};
let addedBytes = 0;
for (const name of (await readdir(publicRoot)).sort()) {
    if (!/\.(webp|png|jpe?g)$/i.test(name)) continue;
    const input = await readFile(path.join(publicRoot, name));
    const meta = await sharp(input, {limitInputPixels: 25_000_000}).metadata();
    if (!meta.width || !meta.height || meta.width < 640 || (meta.pages ?? 1) !== 1) continue;
    const variants = [];
    for (const width of [160, 320, 480, 800, 1200, 1600, 1920, 2560].filter(w => w < meta.width)) {
        const data = await sharp(input, {limitInputPixels: 25_000_000}).autoOrient()
            .resize({width, withoutEnlargement: true}).webp({quality: 90, alphaQuality: 100, effort: 4}).toBuffer();
        // Do not add a larger encoding of an already compact static asset.
        if (data.length >= input.length) continue;
        const sha = createHash("sha256").update(data).digest("hex");
        const filename = `${sha}-${width}.webp`;
        await writeFile(path.join(output, filename), data);
        addedBytes += data.length;
        variants.push({src: `/image-variants/v1/${filename}`, width});
    }
    variants.push({src: `/${name}`, width: meta.width});
    manifest[`/${name}`] = {width: meta.width, height: meta.height, variants};
}
await mkdir(path.join(root, "src/generated"), {recursive: true});
await writeFile(path.join(root, "src/generated/responsive-images.json"), JSON.stringify(manifest) + "\n");
console.log(`Responsive static images: ${Object.keys(manifest).length} sources, ${addedBytes} derivative bytes; originals retained.`);
