import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile), root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), dir = path.resolve(process.env.IMAGE_EVIDENCE_DIR || path.join(root, '.cache/image-optimization'));
await fs.mkdir(dir, { recursive: true });
const origin = 'http://127.0.0.1:14441';
const sha = b => createHash('sha256').update(b).digest('hex');
await fs.mkdir(path.join(dir, 'api-cache'), { recursive: true });
await fs.mkdir(path.join(dir, 'media-cache'), { recursive: true });
let index = JSON.parse(await fs.readFile(path.join(dir, 'fixture-index.json'), 'utf8').catch(() => '{}'));
let pending = new Map();
let serial = Promise.resolve();
const baseline = JSON.parse(await fs.readFile(path.join(dir, 'http-baseline.json'), 'utf8').catch(() => '{"images":[]}'));
async function ensure(url) { url = url.split('?')[0]; if (index[url])
    return index[url]; if (pending.has(url))
    return pending.get(url); const work = serial.then(async () => { if (index[url])
    return index[url]; if (Object.keys(index).length >= 80)
    throw Error('80-source fixture cap'); const id = sha(url); const folder = path.join(dir, 'media-cache', id); await fs.mkdir(folder, { recursive: true }); const measured = baseline.images.find(x => x.url === url); const image = { url }; if (measured?.file)
    image.file = path.relative(folder, path.join(dir, measured.file)); await fs.writeFile(path.join(folder, 'input.json'), JSON.stringify({ publicMediaOrigin: 'https://api.vympel.kz', images: [image] })); await exec(process.execPath, [path.join(root, 'scripts/image-performance/prepare-backfill.mjs'), path.join(folder, 'input.json'), path.join(folder, 'plan')], { env: process.env, windowsHide: true, timeout: 50000 }); const manifest = JSON.parse(await fs.readFile(path.join(folder, 'plan/manifest.json'), 'utf8')); const m = manifest.images[0]; if (!m)
    throw Error('Skipped source ' + url); index[url] = { ...m, folder: path.join(folder, 'plan'), objects: manifest.objects }; await fs.writeFile(path.join(dir, 'fixture-index.json'), JSON.stringify(index, null, 2)); console.log('fixture media ' + Object.keys(index).length); return index[url]; }); pending.set(url, work); serial = work.catch(() => { }); return work; }
async function api(suffix) { const name = sha(suffix) + '.json'; const file = path.join(dir, 'api-cache', name); let text = await fs.readFile(file, 'utf8').catch(() => null); if (!text) {
    const response = await fetch('https://api.vympel.kz/api/public' + suffix, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok)
        throw Error('api ' + response.status + ' ' + suffix);
    text = await response.text();
    await fs.writeFile(file, text);
} return JSON.parse(text); }
async function rewrite(value, mode) { if (typeof value === 'string' && value.startsWith('https://api.vympel.kz/media/')) {
    const url = value.split('?')[0];
    const m = await ensure(url);
    return origin + '/' + mode + '/media/' + m.bucket + '/' + (mode === 'after' ? m.originalKey : m.oldKey);
} if (Array.isArray(value))
    return Promise.all(value.map(v => rewrite(v, mode))); if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await rewrite(v, mode)]));
    return Object.fromEntries(entries);
} return value; }
const server = http.createServer(async (req, res) => { try {
    const u = new URL(req.url, origin);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(204);
        return res.end();
    }
    const apiMatch = /^\/(before|after)\/api\/public(\/.*)$/.exec(u.pathname);
    if (apiMatch) {
        const data = await api(apiMatch[2] + u.search);
        const body = JSON.stringify(await rewrite(data, apiMatch[1]));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(body);
    }
    const mediaMatch = /^\/(before|after)\/media\/([^/]+)\/(.*)$/.exec(u.pathname);
    if (mediaMatch) {
        const [, mode, bucket, key] = mediaMatch;
        let file, object;
        for (const m of Object.values(index)) {
            if (m.bucket !== bucket)
                continue;
            if (mode === 'before' && key === m.oldKey) {
                file = path.join(m.folder, m.originalKey);
                object = m.objects.find(o => o.key === m.originalKey);
                break;
            }
            const o = m.objects.find(o => o.key === key);
            if (o) {
                object = o;
                file = path.join(m.folder, key);
                break;
            }
        }
        if (!file) {
            res.writeHead(404);
            return res.end();
        }
        const etag = '"' + object.sha256 + '"';
        const headers = { 'Content-Type': object.contentType, 'ETag': etag, 'Access-Control-Allow-Origin': '*', 'Timing-Allow-Origin': '*', ...(mode === 'after' ? { 'Cache-Control': 'public, max-age=31536000, immutable' } : {}) };
        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, headers);
            return res.end();
        }
        res.writeHead(200, { ...headers, 'Content-Length': object.bytes });
        return res.end(req.method === 'HEAD' ? undefined : await fs.readFile(file));
    }
    res.writeHead(404);
    res.end();
}
catch (e) {
    console.error(e.message);
    res.writeHead(502);
    res.end('fixture error');
} });
server.listen(14441, '127.0.0.1', () => console.log('fixture listening'));
if (process.argv.includes('--prewarm')) {
    for (const locale of ['ru', 'en', 'kz'])
        for (const suffix of ['/cms/pages/home?lang=' + locale, '/product/catalog/' + locale + '?size=9&page=0&sort=priceAsc', '/product/' + locale + '/46', '/cms/pages/catalog?lang=' + locale, '/cms/pages/brands?lang=' + locale, '/cms/pages/product?lang=' + locale]) {
            try {
                await rewrite(await api(suffix), 'after');
                console.log('prewarmed ' + suffix);
            }
            catch (e) {
                console.log('prewarm failure ' + e.message);
            }
        }
    console.log('PREWARM COMPLETE');
}
