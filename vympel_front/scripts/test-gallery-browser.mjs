import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyGalleryInteraction} from './gallery-interaction.mjs';

const images = [
    ['d28811e6-f5ab-4cb4-9858-ffb017a94dcf','5877cefbca87be90b78877b7818d177e947a42685791ebd0d5b1ad0dbc537943','1254x1254'],
    ['fe810e91-6ac0-4526-b62a-4c59c861ca32','254f793b3e175180458e343c076bd94cfc54bbc72f2c408801233d48c67aac44','1086x1448'],
    ['31e0850d-cede-4c40-923a-fcff6c95b5d1','1dd1a9935b086649042dec809f26b5c18ba28098cadb7af14a9258d56aac53a5','1024x1536'],
];
const prefix = '/media/vympel-staging/';
const family = ([id, sha, size]) => `product/responsive-v1/${id}/${sha}/${size}/original.png`;

export function galleryProduct(product, id) {
    return {...product, id, images: images.map((image, index) => ({
        id: index + 1, alt: `Gallery image ${index + 1}`, sortOrder: index, isMain: index === 0,
        url: prefix + (id === 47 && index === 0 ? family(image) : `product/${image[0]}.png`),
    }))};
}

async function serveImage(route) {
    const key = new URL(route.request().url()).pathname.slice(prefix.length);
    const image = images.find(tuple => key === `product/${tuple[0]}.png` || key.startsWith(family(tuple).replace('original.png', '')));
    assert.ok(image, `Unexpected media request ${key}`);
    const webp = key.endsWith('.webp');
    let body;
    if (process.env.GALLERY_MEDIA_DIR) {
        // Optional: exercise the retained, already encoded batch instead of generic test bytes.
        const file = key.includes('/responsive-v1/') ? key : family(image);
        assert.ok(!file.includes('..'));
        body = await readFile(path.join(process.env.GALLERY_MEDIA_DIR, file));
    } else {
        body = await readFile(new URL(`../public/${webp ? 'Romanson_banner.webp' : 'category_1.png'}`, import.meta.url));
    }
    await route.fulfill({body, contentType: webp ? 'image/webp' : 'image/png'});
}

async function runCase(browser, origin, width, id, reproduce) {
    const context = await browser.newContext({viewport: {width, height: width === 390 ? 844 : 1000}, deviceScaleFactor: width === 390 ? 2 : 1});
    await context.route(url => /^https?:$/.test(url.protocol) && url.hostname !== '127.0.0.1', route => route.abort());
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.resourceType() === 'image') requests.push(request.url()); });
    let release;
    const held = new Promise(resolve => { release = resolve; });
    let heldScripts = 0;
    try {
        await page.route(url => url.pathname.startsWith(prefix), serveImage);
        await page.route(url => url.origin === origin && url.pathname.startsWith('/_next/static/') && url.pathname.endsWith('.js'), async route => {
            heldScripts++; await held; await route.continue();
        });
        await page.addInitScript(() => {
            window.galleryTimeline = [];
            const record = (event, detail = {}) => window.galleryTimeline.push({event, ms: performance.now(), ...detail});
            const region = 'section[aria-label="Изображения товара"]';
            for (const event of ['pointerdown','click','keydown']) document.addEventListener(event, e => {
                if (e.target.closest?.(region)) record(event, {button: e.target.closest('button')?.getAttribute('aria-label')});
            }, true);
            const observe = new MutationObserver(mutations => {for (const m of mutations) {
                if (m.target.matches?.(region) && m.attributeName === 'aria-busy') record('busy', {value:m.target.getAttribute('aria-busy')});
                if (m.attributeName === 'data-state' && m.target.closest?.(region)) record('dialog-state', {value:m.target.getAttribute('data-state')});
            }});
            observe.observe(document,{subtree:true,attributes:true,attributeFilter:['aria-busy','data-state']});
        });
        const url = `${origin}/ru/product/${id}`;
        assert.equal((await page.goto(url, {waitUntil: 'commit'})).status(), 200);
        const region = 'section[aria-label="Изображения товара"]';
        const main = page.locator(`${region} button[aria-label="Открыть увеличенное изображение товара"]`).first();
        await main.scrollIntoViewIfNeeded();
        await main.locator('img').evaluate(i => i.decode());
        const pre = await main.evaluate(b => ({ms:performance.now(), disabled:b.disabled, busy:b.closest('section').getAttribute('aria-busy'), dialog:b.getAttribute('data-state')}));
        const box = await main.boundingBox();
        const firstAttempt = await page.evaluate(()=>performance.now());
        await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
        assert.ok(heldScripts > 0, 'No application scripts held');
        assert.equal(await page.getByRole('dialog').count(), 0);
        if (!reproduce) {
            assert.equal(pre.disabled, true, 'SSR zoom was actionable before hydration');
            assert.equal(pre.busy, 'true');
            assert.equal(await page.locator(`${region} button:enabled`).count(), 0, 'An SSR gallery control accepts input');
        } else {assert.equal(pre.disabled, false);}
        release();
        if (reproduce) {
            // Only the historical diagnostic inspects React internals. Admission uses public UI state.
            await page.waitForFunction(sel => Object.keys(document.querySelector(sel) ?? {}).some(k => k.startsWith('__reactProps')), `${region} button[aria-label="Открыть увеличенное изображение товара"]`);
        } else await page.locator(`${region}[aria-busy="false"]`).waitFor();
        const hydrationObserved = await page.evaluate(()=>performance.now());
        assert.equal(await main.getAttribute('data-state'), 'closed', 'Early click replayed later');
        const consent = page.getByRole('button',{name:'Только необходимые',exact:true});
        if (await consent.isVisible()) await consent.click();
        const originalUrl = galleryProduct({}, id).images[0].url;
        let interaction;
        if (reproduce) {
            await main.click(); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
            interaction = {explicitPostHydrationClickOpened: true};
        } else interaction = await verifyGalleryInteraction(page,{originalUrl,requests});
        assert.deepEqual(errors,[]);
        return {width, urlKind:id===46?'legacy':'responsive', pre, firstAttempt, hydrationObserved, heldScripts, interaction, timeline:await page.evaluate(()=>window.galleryTimeline), errors};
    } finally { release(); await context.close(); }
}

export async function verifyGalleryBrowser(origin, {reproduce = false} = {}) {
    assert.equal(new URL(origin).hostname, '127.0.0.1');
    const spec = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
    const {chromium} = await import(spec);
    const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless:true});
    const cases=[];
    try { for (const width of [390,1440]) for (const id of [46,47]) cases.push(await runCase(browser,origin,width,id,reproduce)); }
    finally {await browser.close();}
    if (process.env.GALLERY_EVIDENCE) await writeFile(process.env.GALLERY_EVIDENCE,JSON.stringify({mode:reproduce?'historical-reproduction':'regression',cases},null,2)+'\n');
    console.log(`Gallery ${reproduce?'historical reproduction':'regression'} passed for ${cases.length} viewport/URL combinations`);
}
