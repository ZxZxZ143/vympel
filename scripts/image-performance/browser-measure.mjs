import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const evidence = path.resolve(process.env.IMAGE_EVIDENCE_DIR || '.cache/image-optimization');
await fs.mkdir(evidence, { recursive: true });
const origin = process.env.IMAGE_TEST_ORIGIN || 'https://preview.vympel.kz';
const label = process.env.IMAGE_TEST_LABEL || 'before';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
const cases = [];
for (const width of [390, 1440])
    for (const route of ['/ru', '/ru/catalog', '/ru/product/46', '/ru/brands/romanson', '/en', '/kz'])
        cases.push({ width, route });
for (const width of [360, 768])
    for (const route of ['/ru', '/ru/catalog', '/ru/product/46'])
        cases.push({ width, route });
const slow = process.env.IMAGE_TEST_SLOW === 'true';
if (slow)
    cases.splice(0, cases.length, ...[390, 1440].flatMap(width => ['/ru', '/ru/catalog', '/ru/product/46'].map(route => ({ width, route }))));
const observationMs = slow ? 30000 : 3000;
const out = { label, origin, observationMs, network: slow ? '1.6 Mbps down / 0.75 Mbps up / 150ms RTT' : (origin.startsWith('http://127.0.0.1:') ? 'unthrottled local replay' : 'unthrottled remote browser'), startedAt: new Date().toISOString(), cases: [] };
try {
    for (const c of cases) {
        const context = await browser.newContext({ viewport: { width: c.width, height: c.width < 700 ? 844 : 1000 }, deviceScaleFactor: c.width < 700 ? 2 : 1, httpCredentials: origin.startsWith('https:') ? { username: process.env.VYMPEL_PREVIEW_USER, password: process.env.VYMPEL_PREVIEW_PASSWORD, origin } : undefined });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        let records = new Map();
        const blocked = [];
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        if (slow)
            await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
        await cdp.send('Network.setBlockedURLs', { urls: ['https://vympel.kz/*', 'https://www.vympel.kz/*'] });
        page.on('request', r => { if (!['preview.vympel.kz', 'api.vympel.kz', '127.0.0.1', 'localhost'].includes(new URL(r.url()).hostname))
            blocked.push(r.url()); });
        cdp.on('Network.requestWillBeSent', e => records.set(e.requestId, { url: e.request.url, type: e.type, start: e.timestamp, priority: e.request.initialPriority, initiator: e.initiator.type }));
        cdp.on('Network.dataReceived', e => { const r = records.get(e.requestId); if (r)
            r.receivedBytes = (r.receivedBytes || 0) + e.encodedDataLength; });
        cdp.on('Network.responseReceivedExtraInfo', e => { const r = records.get(e.requestId); if (r)
            r.wireStatus = e.statusCode; });
        cdp.on('Network.resourceChangedPriority', e => { const r = records.get(e.requestId); if (r)
            r.priority = e.newPriority; });
        cdp.on('Network.responseReceived', e => { const r = records.get(e.requestId); if (r) {
            const h = e.response.headers;
            r.response = { status: e.response.status, mime: e.response.mimeType, cacheControl: h['cache-control'] ?? h['Cache-Control'], etag: h.etag ?? h.ETag, nextCache: h['x-nextjs-cache'], fromDiskCache: e.response.fromDiskCache, fromServiceWorker: e.response.fromServiceWorker, timing: e.response.timing };
            r.responseAt = e.timestamp;
        } });
        cdp.on('Network.requestServedFromCache', e => { const r = records.get(e.requestId); if (r)
            r.servedFromCache = true; });
        cdp.on('Network.loadingFinished', e => { const r = records.get(e.requestId); if (r) {
            r.bytes = e.encodedDataLength;
            r.end = e.timestamp;
        } });
        cdp.on('Network.loadingFailed', e => { const r = records.get(e.requestId); if (r)
            r.error = e.errorText; });
        await page.addInitScript(() => { window.__imageMetrics = { lcp: null, cls: 0, samples: [] }; new PerformanceObserver(list => { const e = list.getEntries().at(-1); window.__imageMetrics.lcp = { startTime: e.startTime, loadTime: e.loadTime, renderTime: e.renderTime, size: e.size, url: e.url, element: e.element?.outerHTML.slice(0, 600) }; }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver(list => { for (const e of list.getEntries())
            if (!e.hadRecentInput)
                window.__imageMetrics.cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); for (const delay of [100, 500, 1000, 2000, 5000])
            setTimeout(() => { const hero = document.querySelector('[data-motion="hero"]'); const img = hero?.querySelector('img:not([aria-hidden])'); window.__imageMetrics.samples.push({ time: performance.now(), heroOpacity: hero ? getComputedStyle(hero).opacity : null, complete: img?.complete, src: img?.currentSrc }); }, delay); });
        for (const cache of ['cold', 'warm']) {
            records = new Map();
            if (cache === 'cold')
                await cdp.send('Network.clearBrowserCache');
            await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
            const started = Date.now();
            const response = await page.goto(origin + c.route, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForTimeout(observationMs);
            const dom = await page.evaluate(() => ({ metrics: window.__imageMetrics, images: [...document.images].map(i => { const b = i.getBoundingClientRect(); return { src: i.currentSrc || i.src, srcSet: i.srcset, sizes: i.sizes, width: b.width, height: b.height, x: b.x, y: b.y, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, complete: i.complete, loading: i.loading, priority: i.fetchPriority, alt: i.alt, opacity: getComputedStyle(i).opacity }; }), overflow: document.documentElement.scrollWidth > innerWidth, preloads: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map(e => ({ href: e.href, srcset: e.imageSrcset })), resources: performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img').map(r => ({ url: r.name, start: r.startTime, duration: r.duration, transfer: r.transferSize })) }));
            const network = [...records.values()].filter(r => r.type === 'Image');
            const result = { ...c, cache, status: response.status(), wallMs: Date.now() - started, errors, ...dom, network, blocked: [...new Set(blocked)], imageBytes: network.reduce((s, r) => s + (r.bytes ?? r.receivedBytes ?? 0), 0) };
            out.cases.push(result);
            await fs.writeFile(path.join(evidence, label + '-browser.json'), JSON.stringify(out, null, 2));
            if (cache === 'cold')
                await page.screenshot({ path: path.join(evidence, label + '-' + c.width + '-' + c.route.slice(1).replaceAll('/', '-') + '.png'), fullPage: false });
            console.log(JSON.stringify({ route: c.route, width: c.width, cache, status: result.status, bytes: result.imageBytes, lcp: dom.metrics.lcp?.startTime, images: network.length, broken: dom.images.filter(i => i.src && i.complete && !i.naturalWidth).length }));
            await page.goto('about:blank');
        }
        await context.close();
    }
}
finally {
    await browser.close();
}
