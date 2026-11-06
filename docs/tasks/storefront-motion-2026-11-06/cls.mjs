import {pathToFileURL} from "node:url";
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({channel: "msedge", headless: true});
const TARGETS = '[data-motion], [data-motion="stagger"] > *, [data-motion-inner]';
for (const [route, reducedMotion] of [["/ru", "no-preference"], ["/ru", "no-preference"], ["/ru", "reduce"]]) {
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion});
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__shifts.push({t: Math.round(e.startTime), v: +e.value.toFixed(4), src: e.sources.map((s) => (s.node?.nodeName ?? "?") + "." + String(s.node?.className ?? "").slice(0, 50))}); })).observe({type: "layout-shift", buffered: true});
  });
  await page.goto("http://127.0.0.1:3300" + route, {waitUntil: "networkidle"});
  await new Promise((r) => setTimeout(r, 1500));
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 500) { await page.evaluate((t) => scrollTo(0, t), y); await new Promise((r) => setTimeout(r, 160)); }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await new Promise((r) => setTimeout(r, 2600));
  const hidden = await page.evaluate((sel) => [...document.querySelectorAll(sel)].filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length, TARGETS);
  console.log(route, reducedMotion, "hiddenAfterScroll=" + hidden, JSON.stringify(await page.evaluate(() => window.__shifts)));
  await ctx.close();
}
await browser.close();
