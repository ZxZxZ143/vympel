// Read-only preparation. This program cannot write to S3 or a database.
import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {mkdir, mkdtemp, readFile, writeFile, stat, unlink, rmdir} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {createRequire} from "node:module";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "vympel_front/package.json"));
const sharp = require("sharp");
sharp.concurrency(1);
sharp.cache(false);
const exec = promisify(execFile);
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
function hasApng(bytes) {
    for (let offset = 8; offset + 12 <= bytes.length;) {
        const length = bytes.readUInt32BE(offset);
        if (length > bytes.length - offset - 12) return true;
        if (bytes.toString("ascii", offset + 4, offset + 8) === "acTL") return true;
        offset += length + 12;
    }
    return false;
}
const [inputFile, outputDirectory] = process.argv.slice(2);
if (!inputFile || !outputDirectory || !process.env.VYMPEL_IMAGE_VARIANTS_EXECUTABLE) {
    throw Error("Usage: VYMPEL_IMAGE_VARIANTS_EXECUTABLE=cwebp node scripts/image-performance/prepare-backfill.mjs explicit-input.json output-directory");
}
const input = JSON.parse(await readFile(inputFile, "utf8"));
if (!Array.isArray(input.images) || input.images.length < 1 || input.images.length > 10) throw Error("Select 1–10 explicit images per reviewed batch");
const origin = new URL(input.publicMediaOrigin);
if (origin.protocol !== "https:" || origin.username || origin.password) throw Error("An explicit HTTPS public media origin is required");
const out = path.resolve(outputDirectory);
await mkdir(out, {recursive: true});
const manifest = {spec: "responsive-v1", codec: (await exec(process.env.VYMPEL_IMAGE_VARIANTS_EXECUTABLE, ["-version"], {windowsHide: true})).stdout.trim(), originalsPreserved: true, objects: [], images: [], skipped: []};
const seen = new Set();
for (const selected of input.images) {
    const url = new URL(selected.url);
    if (url.origin !== origin.origin || url.username || url.password || url.search || url.hash) throw Error("Unexpected media URL");
    const match = /^\/media\/([a-z0-9][a-z0-9.-]{1,62})\/(product|cms)\/([a-f0-9-]{36})\.(png|jpe?g)$/.exec(url.pathname);
    if (!match || seen.has(url.href)) throw Error("Only unique legacy product/CMS originals may be selected");
    seen.add(url.href);
    const [, bucket, area, id, extension] = match;
    const oldKey = `${area}/${id}.${extension}`;
    let bytes;
    if (selected.file) bytes = await readFile(path.resolve(path.dirname(inputFile), selected.file));
    else {
        const response = await fetch(url, {redirect: "error", signal: AbortSignal.timeout(20000)});
        if (!response.ok) throw Error(`Media read failed: ${response.status}`);
        const chunks = []; let size = 0;
        for await (const chunk of response.body) {
            size += chunk.length;
            if (size > 10 * 1024 * 1024) throw Error("Original exceeds upload byte limit");
            chunks.push(chunk);
        }
        bytes = Buffer.concat(chunks);
    }
    if (bytes.length > 10 * 1024 * 1024) throw Error("Original exceeds upload byte limit");
    const sourceSha256 = sha256(bytes);
    if (selected.sha256 && selected.sha256 !== sourceSha256) throw Error("Source checksum changed; review a fresh plan");
    const meta = await sharp(bytes, {limitInputPixels: 25_000_000, failOn: "warning"}).metadata();
    if (!['png', 'jpeg'].includes(meta.format) || !meta.width || !meta.height || meta.width > 10000 || meta.height > 10000) throw Error("Unsupported or oversized raster");
    if (meta.exif || (meta.pages ?? 1) !== 1 || (meta.format === "png" && hasApng(bytes))) {
        manifest.skipped.push({oldKey, reason: "EXIF/animation retained unchanged, same as upload encoder"});
        continue;
    }
    // Fully decode once before passing untrusted bytes to the codec.
    await sharp(bytes, {limitInputPixels: 25_000_000, failOn: "warning"}).raw().toBuffer();
    const hasTransparency = meta.hasAlpha && !(await sharp(bytes, {limitInputPixels: 25_000_000}).stats()).isOpaque;
    const base = `${area}/responsive-v1/${id}/${sourceSha256}/${meta.width}x${meta.height}`;
    const originalKey = `${base}/original.${extension}`;
    const source = path.join(out, originalKey);
    await mkdir(path.dirname(source), {recursive: true});
    await writeFile(source, bytes, {flag: "wx"}).catch(async error => {
        if (error.code !== "EEXIST" || sha256(await readFile(source)) !== sourceSha256) throw error;
    });
    const widths = [...new Set([160, 320, 480, 800, 1200, 1600, ...(area === "cms" ? [1920, 2560] : [])].map(w => Math.min(w, meta.width)))];
    const started = performance.now(); let outputBytes = 0;
    for (const width of widths) {
        const key = `${base}/w${width}.webp`;
        const destination = path.join(out, key);
        // Existing plan files are never overwritten. Verify their recorded checksum below on re-run.
        if (!(await stat(destination).catch(() => null))) {
            // Windows cwebp uses a legacy path API. Encode in a short, owned temp
            // directory; Node can safely write the long, deterministic object key.
            const temporary = await mkdtemp(path.join(os.tmpdir(), "vympel-backfill-"));
            const temporarySource = path.join(temporary, "source");
            const temporaryOutput = path.join(temporary, "out.webp");
            try {
                await writeFile(temporarySource, bytes);
                await exec(process.env.VYMPEL_IMAGE_VARIANTS_EXECUTABLE,
                    ["-quiet", "-q", "88", "-alpha_q", "100", "-m", "4", "-sharp_yuv", "-metadata", "icc", "-resize", String(width), "0", temporarySource, "-o", temporaryOutput],
                    {windowsHide: true, timeout: Math.max(1, Math.floor(20000 - (performance.now() - started))), maxBuffer: 65536});
                await writeFile(destination, await readFile(temporaryOutput), {flag: "wx"});
            } finally {
                await unlink(temporarySource).catch(() => {});
                await unlink(temporaryOutput).catch(() => {});
                await rmdir(temporary);
            }
        }
        const data = await readFile(destination);
        outputBytes += data.length;
        if (outputBytes > 32 * 1024 * 1024) throw Error("Derivative output budget exceeded");
        const decoded = await sharp(data).metadata();
        if (decoded.format !== "webp" || decoded.width !== width || Math.abs(decoded.height - meta.height * width / meta.width) > 1) throw Error("Derivative dimensions failed verification");
        if (hasTransparency && !decoded.hasAlpha) throw Error("Transparency was lost");
        manifest.objects.push({bucket, key, bytes: data.length, sha256: sha256(data), contentMd5: createHash("md5").update(data).digest("base64"), contentType: "image/webp", width, height: decoded.height});
    }
    manifest.objects.push({bucket, key: originalKey, bytes: bytes.length, sha256: sourceSha256, contentMd5: createHash("md5").update(bytes).digest("base64"), contentType: meta.format === "png" ? "image/png" : "image/jpeg"});
    manifest.images.push({bucket, oldKey, originalKey, sourceSha256, width: meta.width, height: meta.height});
}
const manifestPath = path.join(out, "manifest.json");
const previous = await readFile(manifestPath, "utf8").catch(() => null);
if (previous && previous !== JSON.stringify(manifest, null, 2) + "\n") throw Error("Existing plan differs; use a new review directory");
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
const sql = ["-- REVIEW ONLY. Upload and GET/verify every manifest object before changing references.", "-- Originals at oldKey are retained permanently by this plan. No DELETE is generated.", "BEGIN;", ...manifest.images.flatMap(image => image.oldKey.startsWith("product/") ? [
    `SELECT id, url FROM media WHERE url = '${image.oldKey}' FOR UPDATE;`,
    `UPDATE media SET url = '${image.originalKey}' WHERE url = '${image.oldKey}' RETURNING id;`,
] : [
    `SELECT id, object_key FROM cms_media WHERE object_key = '${image.oldKey}' FOR UPDATE;`,
    `UPDATE cms_media SET object_key = '${image.originalKey}', updated_at = CURRENT_TIMESTAMP WHERE object_key = '${image.oldKey}' AND storage_type = 'OBJECT_STORAGE' AND lifecycle_status = 'ACTIVE' RETURNING id;`,
]), "-- Review row counts and public URLs before separately authorizing COMMIT.", "ROLLBACK;", ""].join("\n");
await writeFile(path.join(out, "review-only.sql"), sql);
console.log(JSON.stringify({images: manifest.images.length, skipped: manifest.skipped.length, objects: manifest.objects.length, manifestSha256: sha256(Buffer.from(JSON.stringify(manifest, null, 2) + "\n")), externalWrites: 0}));
