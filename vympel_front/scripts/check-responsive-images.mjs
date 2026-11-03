import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "src/generated/responsive-images.json"), "utf8"));
let checked = 0;
for (const [source, entry] of Object.entries(manifest)) {
    const original = await readFile(path.join(root, "public", source));
    const meta = await sharp(original).metadata();
    const transparency = meta.hasAlpha && !(await sharp(original).stats()).isOpaque;
    assert.equal(entry.width, meta.width, source);
    assert.equal(entry.height, meta.height, source);
    for (const variant of entry.variants.filter(v => v.src !== source)) {
        const match = /^\/image-variants\/v1\/([a-f0-9]{64})-(\d+)\.webp$/.exec(variant.src);
        assert(match, "Only hash-addressed static derivatives are immutable");
        const bytes = await readFile(path.join(root, "public", variant.src));
        assert.equal(createHash("sha256").update(bytes).digest("hex"), match[1]);
        const decoded = await sharp(bytes).metadata();
        assert.equal(decoded.format, "webp");
        assert.equal(decoded.width, variant.width);
        assert.equal(Number(match[2]), variant.width);
        assert(variant.width < entry.width && bytes.length < original.length);
        assert(Math.abs(decoded.height - entry.height * variant.width / entry.width) <= 1);
        if (transparency) assert(decoded.hasAlpha, `Preserve transparency: ${source}`);
        checked++;
    }
}
console.log(`Verified ${checked} checksummed WebP variants from ${Object.keys(manifest).length} unchanged originals.`);
