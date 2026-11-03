import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";

const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const origin = process.env.IMAGE_TEST_ORIGIN || "http://127.0.0.1:14443";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw Error("Regression fixture must be local");
const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL || "msedge", headless: true});
const results = [];
try {
    for (const width of [390, 1440]) {
        const context = await browser.newContext({viewport: {width, height: 1000}, deviceScaleFactor: width < 700 ? 2 : 1});
        const page = await context.newPage();
        const requests = [];
        page.on("request", request => {if (request.resourceType() === "image") requests.push(request.url());});
        await page.goto(origin + "/ru/product/46");
        const gallery = page.locator('section[aria-label="Изображения товара"]');
        await gallery.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const originalRequests = () => requests.filter(url => /\/product\/responsive-v1\/.*\/original\./.test(url));
        assert.equal(originalRequests().length, 0, "original must not load before lightbox");
        const main = gallery.locator('button[aria-label="Открыть увеличенное изображение товара"]');
        assert.equal(await main.locator("img").count(), 3, "only selected and two loop neighbors are mounted");
        const thumbs = await gallery.locator('button[aria-pressed] img').evaluateAll(images => images.map(i => i.currentSrc));
        assert(thumbs.filter(Boolean).every(src => /\/w(160|320)\.webp$/.test(src)), "thumbnail candidates are bounded");
        await gallery.locator('button[aria-label="Показать изображение 2"]:visible').click();
        await page.waitForTimeout(300);
        await main.nth(1).click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await page.waitForTimeout(500);
        assert.equal(await dialog.locator("img").count(), 1);
        assert.equal(originalRequests().length, 1);
        await dialog.getByRole("button", {name: "Следующее изображение", exact: true}).click();
        await page.waitForTimeout(500);
        assert.equal(await dialog.locator("img").count(), 1);
        assert.equal(originalRequests().length, 2);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300); // Radix restores focus after its close animation.
        assert.equal(await dialog.count(), 0);
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Открыть увеличенное изображение товара");
        assert.equal(await gallery.locator('button[aria-label="Показать изображение 3"]:visible').getAttribute("aria-pressed"), "true");
        results.push({width, test: "gallery selection, bounded thumbnails, on-demand originals, Escape and focus", passed: true});
        await context.close();
    }
    for (const failOriginal of [false, true]) {
        const context = await browser.newContext({viewport: {width: 390, height: 844}});
        const page = await context.newPage();
        // Interception is restricted to failure tests; performance tests never use routing.
        await page.route(/\/product\/responsive-v1\//, route => {
            if (failOriginal || /\/w\d+\.webp$/.test(route.request().url())) return route.fulfill({status: 404});
            return route.continue();
        });
        await page.goto(origin + "/ru/product/46");
        const gallery = page.locator('section[aria-label="Изображения товара"]');
        await gallery.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);
        if (failOriginal) assert(await gallery.locator(".product-image-fallback").count() > 0);
        else assert(await gallery.locator('img[src*="/original."]').evaluateAll(images => images.some(i => i.complete && i.naturalWidth > 0)));
        results.push({test: failOriginal ? "missing original shows existing accessible placeholder" : "failed derivative retries original", passed: true});
        await context.close();
    }
    for (const failOriginal of [false, true]) {
        const context = await browser.newContext({viewport: {width: 390, height: 844}});
        const page = await context.newPage();
        await page.route(/\/cms\/responsive-v1\//, route => {
            if (failOriginal || /\/w\d+\.webp$/.test(route.request().url())) return route.fulfill({status: 404});
            return route.continue();
        });
        await page.goto(origin + "/ru");
        await page.waitForTimeout(1500);
        const hero = await page.locator("img.responsive-home-banner-image").first().evaluate(i => ({src: i.currentSrc, complete: i.complete, width: i.naturalWidth}));
        assert(hero.complete && hero.width > 0);
        assert(failOriginal ? !hero.src.includes("/cms/") : hero.src.includes("/original."));
        results.push({test: failOriginal ? "CMS failure uses approved static fallback" : "CMS derivative failure retries art-directed original", passed: true});
        await context.close();
    }
    const evidence = path.resolve(process.env.IMAGE_EVIDENCE_DIR || ".cache/image-optimization");
    await fs.writeFile(path.join(evidence, "browser-regressions.json"), JSON.stringify(results, null, 2) + "\n");
    console.log(JSON.stringify(results));
} finally { await browser.close(); }
