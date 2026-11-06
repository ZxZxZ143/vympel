// Finite headless check of storefront scroll motion against the running local stand.
import {mkdirSync, writeFileSync} from "node:fs";
import path from "node:path";

const {chromium} = await import((await import("node:url")).pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const BASE = "http://127.0.0.1:3300";
const OUT = process.argv[2];
mkdirSync(OUT, {recursive: true});

const PAGES = ["/ru", "/ru/about", "/ru/brands", "/ru/brands/romanson", "/ru/delivery", "/ru/guarantee", "/ru/payment", "/ru/catalog", "/ru/product/100"];
const WIDTHS = [{width: 390, height: 844}, {width: 1440, height: 900}];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TARGETS = '[data-motion], [data-motion="stagger"] > *, [data-motion-inner]';

const audit = async (page, {screenshot}) => {
    await page.evaluate(() => {
        window.__cls = 0;
        new PerformanceObserver((list) => list.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; }))
            .observe({type: "layout-shift", buffered: true});
    });
    await sleep(1200);
    const initial = await page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        const hidden = (el) => parseFloat(getComputedStyle(el).opacity) < 0.99;
        const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
        return {targets: els.length, hidden: els.filter(hidden).length, inViewHidden: els.filter((el) => inView(el) && hidden(el)).length};
    }, TARGETS);

    // Mid-reveal sample: scroll one screen and capture what the user sees while motion runs.
    await page.evaluate(() => window.scrollBy(0, innerHeight * 0.9));
    await sleep(450);
    if (screenshot) await page.screenshot({path: `${screenshot}-mid.png`});

    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 500) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await sleep(160);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(2600);

    return {
        ...initial,
        ...(await page.evaluate((sel) => {
            const leftovers = [...document.querySelectorAll(sel)].filter((el) =>
                parseFloat(getComputedStyle(el).opacity) < 0.99 || el.style.transform || el.style.clipPath || el.style.opacity);
            return {
                // Visible content after the scroll pass; inline opacity:1 from SplitText or Embla's own track transform is not hidden.
                hiddenAfterScroll: [...document.querySelectorAll(sel)].filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length,
                motionTransformsLeft: [...document.querySelectorAll(sel)].filter((el) => el.style.transform && !el.matches("[data-slot=carousel-content], .flex.ml-0") && el.style.transform !== "none").length,
                leftover: leftovers.length,
                leftoverSample: leftovers.slice(0, 3).map((el) => `${el.tagName}.${String(el.className).slice(0, 40)} ${el.style.cssText.slice(0, 80)}`),
                overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                cls: Number(window.__cls.toFixed(4)),
            };
        }, TARGETS)),
    };
};

const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true});
const results = [];
try {
    for (const reducedMotion of ["no-preference", "reduce"]) {
        for (const viewport of WIDTHS) {
            const context = await browser.newContext({viewport, reducedMotion});
            for (const route of PAGES) {
                const page = await context.newPage();
                const errors = [];
                page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
                page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
                const response = await page.goto(BASE + route, {waitUntil: "networkidle"});
                const name = `${route.replaceAll("/", "_") || "_"}-${viewport.width}-${reducedMotion}`;
                const shot = reducedMotion === "no-preference" && ["/ru", "/ru/about", "/ru/catalog", "/ru/product/100", "/ru/delivery"].includes(route)
                    ? path.join(OUT, name) : null;
                if (shot) await page.screenshot({path: `${shot}-top.png`});
                const result = await audit(page, {screenshot: shot});
                if (shot) await page.screenshot({path: `${shot}-bottom.png`});
                results.push({route, width: viewport.width, reducedMotion, status: response.status(), ...result, errors});
                await page.close();
            }
            await context.close();
        }
    }

    // Interactive controls stay outside motion roots on catalog and product.
    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page = await context.newPage();
    await page.goto(`${BASE}/ru/catalog`, {waitUntil: "networkidle"});
    const catalogBoundary = await page.evaluate(() => {
        const inRoot = (el) => Boolean(el?.closest("[data-motion]")) || [...document.querySelectorAll("[data-motion]")].some((m) => m.contains(el));
        const grid = document.querySelector("#catalog-product-list");
        return {
            gridAnimated: [...(grid?.querySelectorAll("*") ?? [])].some((el) => el.hasAttribute("data-motion")),
            toolbarAnimated: [...document.querySelectorAll(".catalog-toolbar *")].some((el) => el.hasAttribute("data-motion")),
            gridInsideMotion: inRoot(grid),
        };
    });
    // Paginate, then confirm the lower sections still reveal (stale ScrollTrigger positions).
    const t0 = Date.now();
    await page.locator('a[href*="page=2"]').first().click();
    await page.waitForURL(/page=2/);
    const paginationMs = Date.now() - t0;
    await sleep(800);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 500) { await page.evaluate((top) => window.scrollTo(0, top), y); await sleep(160); }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(2600);
    const afterPagination = await page.evaluate((sel) => [...document.querySelectorAll(sel)]
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length, TARGETS);

    await page.goto(`${BASE}/ru/product/100`, {waitUntil: "networkidle"});
    const productBoundary = await page.evaluate(() => {
        const roots = [...document.querySelectorAll("[data-motion]")];
        const main = document.querySelector("main");
        const gallery = main?.querySelector("[aria-roledescription='carousel'], section, .product-gallery");
        const buttons = [...main.querySelectorAll("button")].slice(0, 12);
        return {
            motionTargets: roots.length,
            buttonsInsideTargets: buttons.filter((b) => b.closest("[data-motion]")).map((b) => b.getAttribute("aria-label") ?? b.textContent.trim().slice(0, 30)),
            galleryAnimated: Boolean(gallery?.closest("[data-motion]")),
        };
    });

    // Footer store link in every locale.
    const footer = {};
    for (const locale of ["ru", "en", "kz"]) {
        await page.goto(`${BASE}/${locale}`, {waitUntil: "domcontentloaded"});
        footer[locale] = await page.$$eval('footer a[href="https://2gis.kz/almaty/geo/70000001028382844"]', (links) => links.map((a) => ({
            text: a.textContent.trim(), target: a.target, rel: a.rel, label: a.getAttribute("aria-label"),
        })));
    }
    await context.close();

    // No JavaScript: nothing may be hidden.
    const noJs = await browser.newContext({viewport: {width: 390, height: 844}, javaScriptEnabled: false});
    const noJsResults = {};
    for (const route of ["/ru/about", "/ru/delivery", "/ru/catalog", "/ru/product/100"]) {
        const p = await noJs.newPage();
        await p.goto(BASE + route, {waitUntil: "load"});
        noJsResults[route] = await p.evaluate((sel) => [...document.querySelectorAll(sel)]
            .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length, TARGETS);
        await p.close();
    }
    await noJs.close();

    const summary = {results, catalogBoundary, paginationMs, afterPagination, productBoundary, footer, noJsResults};
    writeFileSync(path.join(OUT, "motion-verify.json"), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 1));
} finally {
    await browser.close();
}
