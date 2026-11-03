import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL || "msedge", headless: true});
const results = [];
try {
    for (const width of [390, 1440]) for (const route of ["/ru/catalog", "/ru/brands/romanson"]) for (const label of ["before", "after"]) {
        const origin = label === "before" ? "http://127.0.0.1:14442" : "http://127.0.0.1:14443";
        const context = await browser.newContext({viewport: {width, height: 1000}, deviceScaleFactor: width < 700 ? 2 : 1});
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.clearBrowserCache");
        await cdp.send("Network.setBlockedURLs", {urls: ["https://vympel.kz/*", "https://www.vympel.kz/*"]});
        const requests = new Map();
        cdp.on("Network.requestWillBeSent", e => {if (e.type === "Image") requests.set(e.requestId, {url: e.request.url});});
        cdp.on("Network.loadingFinished", e => {if (requests.has(e.requestId)) requests.get(e.requestId).bytes = e.encodedDataLength;});
        await page.goto(origin + route);
        const consent = page.getByRole("button", {name: "Только необходимые", exact: true});
        if (await consent.isVisible()) await consent.click();
        for (let step = 0; step < 35; step++) {
            const end = await page.evaluate(() => {
                window.scrollBy(0, 600);
                return scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
            });
            await page.waitForTimeout(100);
            if (end) break;
        }
        await page.waitForTimeout(1500);
        const network = [...requests.values()];
        const product = network.filter(r => /\/product\//.test(r.url));
        results.push({label, width, route, totalBytes: network.reduce((s, r) => s + (r.bytes || 0), 0),
            productBytes: product.reduce((s, r) => s + (r.bytes || 0), 0), productRequests: product.length,
            pending: network.filter(r => r.bytes === undefined).length, network});
        await context.close();
    }
    await fs.writeFile(path.resolve(process.env.IMAGE_EVIDENCE_DIR || ".cache/image-optimization", "scroll-browser.json"), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results.map(({network, ...row}) => row)));
} finally { await browser.close(); }
