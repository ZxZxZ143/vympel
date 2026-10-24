import assert from "node:assert/strict";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";

/** Optional finite browser gate: use an installed Playwright runtime, no production dependency. */
export async function verifyPaginationBrowser(origin, mockOrigin) {
    const {chromium} = await import(process.env.PLAYWRIGHT_MODULE
        ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
    const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true});
    const evidence = path.resolve(process.env.PAGINATION_EVIDENCE_DIR ?? "../.cache/pagination-browser");
    await mkdir(evidence, {recursive: true});
    const errors = [];
    const results = [];
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: "reduce"});
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    // Client suggestions/retries use the same isolated API fixtures as SSR, never a live backend.
    await page.route("**/api/public/**", async (route) => {
        const url = new URL(route.request().url());
        await route.fulfill({response: await route.fetch({url: mockOrigin + url.pathname + url.search})});
    });
    const nav = page.locator('nav[data-scope="pagination"]');
    const activePage = async (number) => {
        await page.waitForFunction((number) => document.querySelector('nav[data-scope="pagination"] [data-pagination-group="pages"] [aria-current="page"]')?.textContent === String(number), number);
    };
    const productIds = async (target) => page.locator(`#${target} a[href*="/product/"]`).evaluateAll((links) => [...new Set(links.map((link) => Number(link.pathname.split("/").at(-1))))]);
    try {
        for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
            await page.setViewportSize({width, height: 1000});
            for (const [route, target, current, count] of [["/en/catalog?page=4", "catalog-product-list", 4, 9], ["/en/brands/romanson?page=2", "brand-product-list", 2, 15]]) {
                await page.goto(origin + route);
                await activePage(current);
                await nav.scrollIntoViewIfNeeded();
                await page.waitForFunction(() => document.fonts.status === "loaded");
                const geometry = await nav.evaluate((element) => ({
                    overflow: document.documentElement.scrollWidth > innerWidth,
                    bounds: {left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right},
                    targets: [...element.querySelectorAll("a")].filter((link) => link.getClientRects().length).map((link) => ({width: link.getBoundingClientRect().width, height: link.getBoundingClientRect().height})),
                    pages: [...element.querySelectorAll('[data-pagination-group="pages"] [data-part="item"]')].map((link) => Number(link.textContent)),
                    active: [...element.querySelectorAll('[aria-current="page"]')].filter((link) => link.getClientRects().length).length,
                    visibleRanges: [...element.querySelectorAll('[data-pagination-group="ranges"] a')].filter((link) => link.getClientRects().length).length,
                    visibleArrows: [...element.querySelectorAll('[data-part="prev-trigger"], [data-part="next-trigger"]')].filter((link) => link.getClientRects().length).length,
                    numericCenters: [...element.querySelectorAll('[data-pagination-group="pages"] [data-part="item"]')].map((link) => link.getBoundingClientRect().top + link.getBoundingClientRect().height / 2),
                }));
                assert.equal(geometry.overflow, false, `${width}: ${route} overflows`);
                assert.equal(geometry.active, width < 1024 ? 1 : 2);
                assert.equal(new Set(geometry.pages).size, geometry.pages.length);
                assert.ok(geometry.targets.every((target) => target.width >= (width < 1024 ? 35.5 : 44) - 0.1 && target.height >= (width < 1024 ? 35.5 : 44) - 0.1));
                assert.ok(Math.max(...geometry.numericCenters) - Math.min(...geometry.numericCenters) < 1);
                if (width < 1024) {
                    assert.equal(geometry.visibleRanges, 0);
                    assert.equal(geometry.visibleArrows, 0);
                } else {
                    assert.ok(geometry.visibleRanges > 0);
                    assert.ok(geometry.visibleArrows > 0);
                }
                assert.equal((await productIds(target)).length, count);
                await nav.screenshot({path: path.join(evidence, `${target}-${width}.png`)});
                results.push({width, route, ...geometry});
            }
        }
        await page.setViewportSize({width: 390, height: 900});
        await page.goto(origin + "/en/brands/romanson");
        await activePage(1);
        assert.equal(await nav.locator('[data-part="prev-trigger"]').count(), 0);
        await nav.locator('[data-pagination-group="pages"] [data-part="item"][data-index="2"]').click();
        await activePage(2);
        assert.deepEqual(await productIds("brand-product-list"), Array.from({length: 15}, (_, i) => i + 16));
        assert.equal(new URL(page.url()).hash, "#brand-product-list");
        assert.ok(await page.locator("#brand-product-list").evaluate((element) => element.getBoundingClientRect().top < 250));
        await page.reload(); await activePage(2);
        await page.goBack(); await activePage(1);
        await page.goForward(); await activePage(2);
        await page.goto(origin + "/en/brands/romanson?page=4"); await activePage(4);
        assert.equal(await nav.locator('[data-part="next-trigger"]').count(), 0);
        assert.deepEqual(await productIds("brand-product-list"), Array.from({length: 12}, (_, i) => i + 46));

        await page.setViewportSize({width: 1440, height: 1000});
        await page.goto(origin + "/en/catalog?brand=1&page=2&search=Romanson");
        await activePage(2);
        await page.getByRole("button", {name: "Sort: Not selected", exact: true}).click();
        assert.equal(await page.locator('form[aria-hidden="false"] input[type="radio"]').count(), 4);
        assert.equal(await page.locator('form[aria-hidden="false"] input:checked').count(), 0);
        await page.getByLabel("Price ascending", {exact: true}).check({force: true});
        await activePage(1);
        assert.equal(new URL(page.url()).searchParams.get("sort"), "priceAsc");
        assert.equal(new URL(page.url()).searchParams.get("search"), "Romanson");
        await nav.getByRole("link", {name: "Next page", exact: true}).click(); await activePage(2);
        await page.reload(); await activePage(2);
        assert.equal(new URL(page.url()).searchParams.get("sort"), "priceAsc");
        await page.getByRole("button", {name: "Sort: Price", exact: true}).click();
        await page.getByRole("button", {name: "Reset", exact: true}).click(); await activePage(1);
        assert.equal(new URL(page.url()).searchParams.get("sort"), null);
        assert.equal(new URL(page.url()).searchParams.get("brand"), "1");
        assert.equal(new URL(page.url()).searchParams.get("search"), "Romanson");
        const next = nav.getByRole("link", {name: "Next page", exact: true});
        await next.focus(); await page.keyboard.press("Enter"); await activePage(2);
        await page.goBack(); await activePage(1);
        for (const [locale, label] of [["ru", "Не выбрано"], ["kz", "Таңдалмаған"], ["en", "Not selected"]]) {
            await page.goto(origin + `/${locale}/catalog?search=Romanson`);
            assert.ok(await page.getByRole("button", {name: new RegExp(label)}).count() > 0);
        }
        await page.goto(origin + "/en/catalog?brand=1&page=2&search=Romanson&sort=priceAsc");
        await activePage(2);
        await page.getByRole("button", {name: "Filters", exact: true}).click();
        await page.getByPlaceholder("From", {exact: true}).fill("100");
        await page.getByPlaceholder("To", {exact: true}).fill("500000");
        await page.getByRole("button", {name: "Apply", exact: true}).click(); await activePage(1);
        assert.equal(new URL(page.url()).searchParams.get("priceMin"), "100");
        assert.equal(new URL(page.url()).searchParams.get("search"), "Romanson");
        assert.equal(new URL(page.url()).searchParams.get("sort"), "priceAsc");
        await nav.getByRole("link", {name: "Next page", exact: true}).click(); await activePage(2);
        assert.equal(new URL(page.url()).searchParams.get("priceMax"), "500000");
        const input = page.locator('input[role="combobox"]:visible').first();
        await input.fill("Romanson TM9A19MMW(BK)");
        await page.getByRole("dialog").getByRole("link", {name: /Romanson TM9A19MMW/}).waitFor();
        await input.press("Enter"); await activePage(1);
        assert.equal(new URL(page.url()).searchParams.get("search"), "Romanson TM9A19MMW(BK)");
        assert.equal(new URL(page.url()).searchParams.get("sort"), null);
        assert.equal(new URL(page.url()).searchParams.get("brand"), null);
        await page.goto(origin + "/en/catalog/ACCESSORY?page=2&search=Romanson&sort=priceAsc");
        await activePage(2);
        await page.getByRole("button", {name: "Women's", exact: true}).click(); await activePage(1);
        assert.equal(new URL(page.url()).pathname, "/en/catalog/ACCESSORY");
        assert.equal(new URL(page.url()).searchParams.get("gender"), "2");
        assert.equal(new URL(page.url()).searchParams.get("sort"), "priceAsc");
        assert.equal(await page.getByRole("button", {name: "Filters", exact: true}).count(), 0);
        assert.deepEqual(errors, [], "browser must not report hydration/runtime errors");
        await writeFile(path.join(evidence, "results.json"), JSON.stringify({results, errors, navigation: "passed", sorting: "passed"}, null, 2));
        console.log("Pagination browser matrix passed: 8 widths, catalog/brand, real links, direct/reload/history, keyboard and sorting/reset.");
    } finally {
        await browser.close();
    }
}
