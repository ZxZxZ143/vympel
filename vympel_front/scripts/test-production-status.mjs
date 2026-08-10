import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {readFile, readdir} from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const buildId = path.join(root, ".next", "BUILD_ID");
const locales = ["ru", "kz", "en"];

await readFile(buildId, "utf8").catch(() => {
    throw new Error("Production build is missing. Run `npm run build` before this status test.");
});

const notFoundTitles = Object.fromEntries(await Promise.all(locales.map(async (locale) => {
    const messages = JSON.parse(await readFile(path.join(root, "src", "messages", `${locale}.json`), "utf8"));
    return [locale, messages.states.notFound.title];
})));

const mockApi = createMockApi();
const mockPort = await listen(mockApi);
const appPort = await availablePort();
const output = [];
const nextProcess = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(appPort)], {
    cwd: root,
    env: {
        ...process.env,
        BASE_API_PUBLIC: `http://127.0.0.1:${mockPort}/api/public`,
        NEXT_PUBLIC_BASE_API_PUBLIC: `http://127.0.0.1:${mockPort}/api/public`,
    },
    stdio: ["ignore", "pipe", "pipe"],
});

for (const stream of [nextProcess.stdout, nextProcess.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
        output.push(chunk);
        if (output.length > 80) output.shift();
    });
}

const origin = `http://127.0.0.1:${appPort}`;

try {
    await waitForServer(origin, nextProcess, output);
    await expectSecurityHeaders(origin, "/ru");
    await expectSecurityHeaders(origin, "/kaspi.png");
    await expectSecurityHeaders(origin, "/api/telemetry");
    await expectFavicon(origin);
    const staticChunk = (await readdir(path.join(root, ".next", "static", "chunks")))
        .find((name) => name.endsWith(".js"));
    assert.ok(staticChunk, "production build must contain a static JS chunk");
    await expectSecurityHeaders(origin, `/_next/static/chunks/${staticChunk}`);

    await expectStatusAndText(origin, "/ru", 200);
    await expectStatusAndText(origin, "/ru/product/1", 200, "Romanson TM9A19MMW(BK)");
    await expectStatusAndText(origin, "/ru/catalog", 200, "/ru/product/1");
    await expectStatusAndText(origin, "/ru/catalog?page=2", 200, "/ru/product/1");
    await expectStatusAndText(origin, "/ru/catalog?page=3", 404, notFoundTitles.ru);
    await expectPermanentRedirect(origin, "/ru/catalog?categoryCode=WATCH_WRIST&page=1", "/ru/catalog/WATCH_WRIST");
    await expectStatusAndText(origin, "/ru/brands/romanson", 200, "ROMANSON");

    await expectApprovedIndexingPolicy(origin);
    await expectMetadataMatrix(origin);

    for (const locale of locales) {
        await expectStatusAndText(
            origin,
            `/${locale}/route-that-does-not-exist`,
            404,
            notFoundTitles[locale]
        );
    }

    await expectStatusAndText(origin, "/ru/product/999", 404, notFoundTitles.ru);
    await expectPermanentRedirect(
        origin,
        "/ru/catalog?categoryCode=MISSING_CATEGORY",
        "/ru/catalog/MISSING_CATEGORY"
    );
    await expectStatusAndText(origin, "/ru/catalog/MISSING_CATEGORY", 404, notFoundTitles.ru);
    await expectStatusAndText(origin, "/ru/brands/missing-brand", 404, notFoundTitles.ru);

    const temporaryFailure = await fetch(`${origin}/ru/catalog?categoryCode=TEMPORARY_FAILURE`);
    assert.notEqual(temporaryFailure.status, 404, "Temporary backend failure must not become a 404");

    const transfer = {};
    for (const pathname of ["/ru", "/ru/catalog?categoryCode=WATCH_WRIST", "/ru/product/1"]) {
        transfer[pathname] = await measureInitialTransfer(origin, pathname);
    }

    console.log("Production status matrix passed: valid=200, missing=404, localized UI=ru/kz/en, temporary failure!=404");
    console.log("Production initial self-hosted transfer bytes:", JSON.stringify(transfer));
    if (process.env.BROWSER_VERIFY_HOLD === "true") {
        console.log(`Browser verification server ready: ${origin}`);
        await new Promise((resolve) => {
            process.once("SIGINT", resolve);
            process.once("SIGTERM", resolve);
        });
    }
} finally {
    await stopProcess(nextProcess);
    await closeServer(mockApi);
    await waitForPortClosed(appPort);
    await waitForPortClosed(mockPort);
}

async function measureInitialTransfer(originUrl, pathname) {
    const response = await fetch(originUrl + pathname);
    const html = await response.text();
    const resourcePaths = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), (match) => match[1])
        .filter((resource) => resource.startsWith("/"))
        .filter((resource) => resource.startsWith("/_next/") || /\.(?:avif|css|gif|jpe?g|js|png|webp|woff2?)(?:\?|$)/i.test(resource));
    let resourceBytes = 0;
    for (const resource of new Set(resourcePaths)) {
        const resourceResponse = await fetch(originUrl + resource);
        resourceBytes += (await resourceResponse.arrayBuffer()).byteLength;
    }
    return {document: Buffer.byteLength(html), referencedResources: resourceBytes, total: Buffer.byteLength(html) + resourceBytes};
}

async function expectSecurityHeaders(originUrl, pathname) {
    const response = await fetch(originUrl + pathname, {redirect: "manual"});
    const csp = response.headers.get("content-security-policy");
    assert.ok(csp, "production response must enforce Content-Security-Policy");
    assert.doesNotMatch(csp, /unsafe-eval|(?:^|\s)\*(?:\s|;|$)/, "production CSP must not contain unsafe-eval or wildcard sources");
    assert.match(csp, /frame-ancestors 'none'/);
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
    assert.equal(response.headers.get("strict-transport-security"), null, "local HTTP must not emit HSTS");
}

async function expectStatusAndText(originUrl, pathname, expectedStatus, expectedText) {
    const response = await fetch(originUrl + pathname, {redirect: "manual"});
    const body = await response.text();
    assert.equal(response.status, expectedStatus, `${pathname} returned ${response.status}, expected ${expectedStatus}`);
    if (expectedText) {
        assert.ok(body.includes(expectedText), `${pathname} did not render expected text: ${expectedText}`);
    }
}

async function expectPermanentRedirect(originUrl, pathname, expectedLocation) {
    const response = await fetch(originUrl + pathname, {redirect: "manual"});
    assert.equal(response.status, 308, `${pathname} must permanently redirect`);
    assert.equal(new URL(response.headers.get("location"), originUrl).pathname, expectedLocation);
}

async function expectApprovedIndexingPolicy(originUrl) {
    const home = await fetch(`${originUrl}/kz`);
    const homeHtml = await home.text();
    assert.equal(home.headers.get("x-robots-tag"), null, "approved build must not emit global noindex header");
    assert.match(homeHtml, /<meta name="robots" content="index, follow"/i);
    assert.match(homeHtml, /<meta property="og:locale" content="kk_KZ"/i);
    assert.match(homeHtml, /<meta name="twitter:card" content="summary_large_image"/i);

    const pageTwo = await fetch(`${originUrl}/ru/catalog?page=2`);
    const pageTwoHtml = await pageTwo.text();
    assert.match(pageTwoHtml, /<link rel="canonical" href="[^"]*\/ru\/catalog\?page=2"/i);
    assert.match(pageTwoHtml, /href="\/ru\/catalog"/i, "page two must link crawlably to page one");

    const productResponse = await fetch(`${originUrl}/en/product/1`);
    const productHtml = await productResponse.text();
    assert.match(productHtml, /Romanson TM9A19MMW\(BK\)/i);
    assert.match(productHtml, /application\/ld\+json/i);
    assert.match(productHtml, /"@type":"Product"/i);
    assert.doesNotMatch(
        productHtml,
        /<a\b[^>]*href="https:\/\/[^\"]*(?:kaspi\.kz|wildberries\.(?:ru|kz))/i,
        "product page must not render Kaspi or Wildberries purchase anchors",
    );
    assert.match(
        productHtml,
        /class="[^"]*mt-product-summary-actions-gap[^"]*"/i,
        "the next product action block must retain the named 28px spacing token",
    );

    for (const locale of locales) {
        for (const route of ["cart", "favorites"]) {
            const response = await fetch(`${originUrl}/${locale}/${route}`);
            const html = await response.text();
            assert.equal(response.status, 200);
            assert.match(html, /<meta name="robots" content="noindex, nofollow"/i);
            assert.doesNotMatch(html, /<link rel="canonical"/i);
        }
    }

    const robotsResponse = await fetch(`${originUrl}/robots.txt`);
    const robotsText = await robotsResponse.text();
    assert.equal(robotsResponse.status, 200);
    assert.match(robotsText, /Sitemap:/i);
    assert.doesNotMatch(robotsText, /cart|favorites/i);

    const sitemapResponse = await fetch(`${originUrl}/sitemap.xml`);
    const sitemapText = await sitemapResponse.text();
    assert.equal(sitemapResponse.status, 200);
    assert.doesNotMatch(sitemapText, /cart|favorites/i);
    const sitemapLocations = Array.from(sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
    assert.ok(sitemapLocations.length > 0, "approved sitemap must publish canonical routes");
    assert.ok(sitemapLocations.every((location) => !new URL(location).search), "sitemap must not contain query variants");
}

async function expectFavicon(originUrl) {
    const response = await fetch(`${originUrl}/favicon.ico`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.equal(response.status, 200, "favicon request must return 200");
    assert.match(response.headers.get("content-type") ?? "", /image\/(?:x-icon|vnd\.microsoft\.icon)/i);
    assert.ok(bytes.length > 500, "favicon must contain real multi-size icon data");
    assert.deepEqual(Array.from(bytes.slice(0, 4)), [0, 0, 1, 0], "favicon must have a valid ICO header");
}

function getMetadataExpectations() {
    return {
    ru: {
        home: ["Vympel — официальный дистрибьютор премиальных часов", "авторизованный дистрибьютор"],
        catalog: ["Каталог часов и аксессуаров — Vympel", "оригинальные наручные"],
        category: ["Наручные часы — Vympel", "Наручные часы в каталоге Vympel"],
        product: ["Romanson TM9A19MMW(BK) — Vympel", "Мужские наручные часы Romanson"],
        brands: ["Бренды часов — Vympel", "Romanson, Adriatica"],
        brand: ["ROMANSON — часы | Vympel", "Южнокорейский бренд"],
        about: ["О компании Vympel — официальный магазин часов", "более 30 лет опыта"],
        delivery: ["Доставка — Vympel", "доставки заказов Vympel"],
        payment: ["Оплата — Vympel", "Способы оплаты заказов Vympel"],
        guarantee: ["Гарантия — Vympel", "Условия гарантии"],
    },
    kz: {
        home: ["Vympel — премиум сағаттардың ресми дистрибьюторы", "авторизацияланған дистрибьюторы"],
        catalog: ["Сағаттар мен аксессуарлар каталогы — Vympel", "түпнұсқа қол сағаттарын"],
        category: ["Қол сағаттары — Vympel", "Қол сағаттары Vympel каталогында"],
        product: ["Romanson TM9A19MMW(BK) — Vympel", "Romanson ерлер қол сағаты"],
        brands: ["Сағат брендтері — Vympel", "Romanson, Adriatica"],
        brand: ["ROMANSON — сағаттар | Vympel", "Заманауи эстетика"],
        about: ["Vympel компаниясы туралы — ресми сағат дүкені", "30 жылдан астам тәжірибе"],
        delivery: ["Жеткізу — Vympel", "жеткізу шарттары"],
        payment: ["Төлем — Vympel", "төлеу тәсілдері"],
        guarantee: ["Кепілдік — Vympel", "кепілдік, сервистік қызмет"],
    },
    en: {
        home: ["Vympel — official distributor of premium watches", "authorized distributor"],
        catalog: ["Watches and accessories catalog — Vympel", "original wristwatches"],
        category: ["Wrist watches — Vympel", "Explore Wrist watches"],
        product: ["Romanson TM9A19MMW(BK) — Vympel", "Romanson men's wristwatch"],
        brands: ["Watch brands — Vympel", "Romanson, Adriatica"],
        brand: ["ROMANSON watches | Vympel", "A South Korean brand"],
        about: ["About Vympel — official watch store", "30+ years of experience"],
        delivery: ["Delivery — Vympel", "Delivery terms and options"],
        payment: ["Payment — Vympel", "Payment options for Vympel"],
        guarantee: ["Warranty — Vympel", "Warranty, service, and return"],
    },
    };
}

function getMetadataRoutes() {
    return {
        home: "",
        catalog: "/catalog",
        category: "/catalog/WATCH_WRIST",
        product: "/product/1",
        brands: "/brands",
        brand: "/brands/romanson",
        about: "/about",
        delivery: "/delivery",
        payment: "/payment",
        guarantee: "/guarantee",
    };
}

async function expectMetadataMatrix(originUrl) {
    const canonicalOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://shop.example.test");
    const descriptionsByLocale = {};
    const metadataExpectations = getMetadataExpectations();
    const metadataRoutes = getMetadataRoutes();

    for (const locale of locales) {
        const expectedLocale = metadataExpectations[locale];
        const descriptions = [];

        for (const [routeName, suffix] of Object.entries(metadataRoutes)) {
            const pathname = `/${locale}${suffix}`;
            const response = await fetch(originUrl + pathname);
            const html = await response.text();
            assert.equal(response.status, 200, `${pathname} must render for metadata verification`);
            const head = readHeadMetadata(html);
            const [expectedTitle, descriptionMarker] = expectedLocale[routeName];

            assert.equal(head.title, expectedTitle, `${pathname} title must be route-specific and localized`);
            assert.ok(head.description.includes(descriptionMarker), `${pathname} description must include ${descriptionMarker}`);
            assert.equal(head.openGraphTitle, head.title, `${pathname} Open Graph title must match title`);
            assert.equal(head.openGraphDescription, head.description, `${pathname} Open Graph description must match description`);
            assert.equal(head.twitterTitle, head.title, `${pathname} Twitter title must match title`);
            assert.equal(head.twitterDescription, head.description, `${pathname} Twitter description must match description`);

            const expectedCanonical = new URL(pathname, canonicalOrigin).toString();
            assert.equal(head.canonical, expectedCanonical, `${pathname} canonical must be self-referential`);
            assert.equal(head.languages.ru, new URL(`/ru${suffix}`, canonicalOrigin).toString());
            assert.equal(head.languages.kk, new URL(`/kz${suffix}`, canonicalOrigin).toString());
            assert.equal(head.languages.en, new URL(`/en${suffix}`, canonicalOrigin).toString());
            assert.equal(head.languages["x-default"], new URL(`/ru${suffix}`, canonicalOrigin).toString());
            descriptions.push(head.description);
        }

        assert.equal(new Set(descriptions).size, descriptions.length, `${locale} route descriptions must not reuse generic copy`);
        descriptionsByLocale[locale] = descriptions;
    }

    assert.ok(descriptionsByLocale.en.every((value) => !/[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(value)), "English metadata must not leak Cyrillic copy");
    assert.ok(descriptionsByLocale.ru.every((value) => !/[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(value)), "Russian metadata must not leak Kazakh-specific copy");
    assert.ok(descriptionsByLocale.kz.every((value) => /[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(value)), "Kazakh descriptions must contain real Kazakh copy");
}

function readHeadMetadata(html) {
    const headHtml = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
    const title = decodeHtml(headHtml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const metaTags = headHtml.match(/<meta\b[^>]*>/gi) ?? [];
    const linkTags = headHtml.match(/<link\b[^>]*>/gi) ?? [];
    const meta = (attributeName, attributeValue) => decodeHtml(getAttribute(
        metaTags.find((tag) => getAttribute(tag, attributeName) === attributeValue) ?? "",
        "content",
    ));
    const link = (rel, hrefLang) => decodeHtml(getAttribute(
        linkTags.find((tag) => getAttribute(tag, "rel") === rel && (!hrefLang || getAttribute(tag, "hreflang") === hrefLang)) ?? "",
        "href",
    ));

    return {
        title,
        description: meta("name", "description"),
        openGraphTitle: meta("property", "og:title"),
        openGraphDescription: meta("property", "og:description"),
        twitterTitle: meta("name", "twitter:title"),
        twitterDescription: meta("name", "twitter:description"),
        canonical: link("canonical"),
        languages: {
            ru: link("alternate", "ru"),
            kk: link("alternate", "kk"),
            en: link("alternate", "en"),
            "x-default": link("alternate", "x-default"),
        },
    };
}

function getAttribute(tag, name) {
    return tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1] ?? "";
}

function decodeHtml(value) {
    return value
        .replace(/&quot;/g, "\"")
        .replace(/&#x27;|&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}

async function waitForServer(originUrl, child, logs) {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
        if (child.exitCode !== null) {
            throw new Error(`Next.js exited before readiness.\n${logs.join("")}`);
        }
        try {
            const response = await fetch(`${originUrl}/ru`, {signal: AbortSignal.timeout(1_000)});
            if (response.status < 500) return;
        } catch {
            // Bounded readiness retry.
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Next.js did not become ready within 30 seconds.\n${logs.join("")}`);
}

function createMockApi() {
    return http.createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        const pathname = decodeURIComponent(url.pathname);

        const productMatch = pathname.match(/^\/api\/public\/product\/(ru|kz|en)\/(\d+)$/);
        if (productMatch) {
            if (productMatch[2] === "999") return json(response, 404, apiError(404, "Resource not found."));
            return json(response, 200, product(productMatch[1]));
        }

        if (/^\/api\/public\/product\/(ru|kz|en)\/\d+\/reviews$/.test(pathname)) {
            return json(response, 200, page([]));
        }
        if (/^\/api\/public\/product\/(ru|kz|en)\/\d+\/recommendations$/.test(pathname)) {
            return json(response, 200, []);
        }
        if (/^\/api\/public\/product\/by-code\/(ru|kz|en)\//.test(pathname)) {
            return json(response, 200, page([]));
        }
        if (/^\/api\/public\/product\/catalog\/(ru|kz|en)$/.test(pathname)) {
            const locale = pathname.match(/^\/api\/public\/product\/catalog\/(ru|kz|en)$/)?.[1] ?? "ru";
            const requestedPage = Number(url.searchParams.get("page") ?? 0);
            if (requestedPage <= 1) {
                return json(response, 200, page([product(locale)], {
                    number: requestedPage,
                    totalElements: 2,
                    totalPages: 2,
                }));
            }
            return json(response, 200, page([], {number: requestedPage, totalElements: 2, totalPages: 2}));
        }
        if (/^\/api\/public\/product\/filters\/(ru|kz|en)$/.test(pathname)) {
            return json(response, 200, catalogFilters());
        }

        const categoryMatch = pathname.match(/^\/api\/public\/category\/(ru|kz|en)\/([^/]+)$/);
        if (categoryMatch) {
            const code = categoryMatch[2];
            if (code === "MISSING_CATEGORY") return json(response, 404, apiError(404, "Resource not found."));
            if (code === "TEMPORARY_FAILURE") return json(response, 500, apiError(500, "Unexpected server error."));
            return json(response, 200, category(code, categoryMatch[1]));
        }

        const allCategoriesMatch = pathname.match(/^\/api\/public\/category\/all\/(ru|kz|en)$/);
        if (allCategoriesMatch) {
            return json(response, 200, [category("WATCH_WRIST", allCategoriesMatch[1])]);
        }

        if (/^\/api\/public\/cms\/pages\//.test(pathname)) {
            return json(response, 200, {pageKey: pathname.split("/").at(-1), blocks: []});
        }

        return json(response, 404, apiError(404, "Resource not found."));
    });
}

function product(locale = "ru") {
    const descriptions = {
        ru: "Мужские наручные часы Romanson с лаконичным циферблатом и фирменной гарантией.",
        kz: "Romanson ерлер қол сағаты, ықшам циферблатпен және фирмалық кепілдікпен.",
        en: "Romanson men's wristwatch with a clean dial and official warranty support.",
    };
    return {
        id: 1,
        sku: "INTEGRATION-1",
        name: "Romanson TM9A19MMW(BK)",
        model: "TM9A19MMW(BK)",
        price: 100000,
        stockQuantity: 1,
        status: "ACTIVE",
        productType: "WATCH",
        category: category("WATCH_WRIST", locale),
        brand: {id: "1", name: "Romanson", country: []},
        collection: null,
        images: [{
            id: 1,
            url: "/Romanson_banner.webp",
            alt: "Integration product",
            sortOrder: 0,
            isMain: true,
        }],
        description: {shortText: descriptions[locale], content: descriptions[locale], title: null},
        watchDetails: null,
        interiorClockDetails: null,
        kaspiUrl: null,
        wildberriesUrl: null,
        ratingAverage: null,
        ratingCount: 0,
    };
}

function category(code, locale = "ru") {
    const names = {ru: "Наручные часы", kz: "Қол сағаттары", en: "Wrist watches"};
    return {id: 1, name: names[locale], code, parent: null, parentId: null};
}

function catalogFilters() {
    return {
        category: {id: null, slug: null, label: "Catalog", parentSlug: null, inheritsFiltersFrom: null},
        filters: [{
            key: "brand",
            label: "Brand",
            type: "checkbox",
            source: "product",
            options: [{value: "1", label: "Romanson", count: 1, disabled: false}],
        }],
    };
}

function page(content, options = {}) {
    const number = options.number ?? 0;
    const totalElements = options.totalElements ?? content.length;
    const totalPages = options.totalPages ?? (content.length ? 1 : 0);
    return {
        content,
        empty: content.length === 0,
        first: number === 0,
        last: number >= totalPages - 1,
        number,
        numberOfElements: content.length,
        size: Math.max(content.length, 1),
        totalElements,
        totalPages,
    };
}

function apiError(status, message) {
    return {status, code: status === 404 ? "RESOURCE_NOT_FOUND" : "INTERNAL_ERROR", message, requestId: "status-test"};
}

function json(response, status, body) {
    response.writeHead(status, {"content-type": "application/json", "x-request-id": "status-test"});
    response.end(JSON.stringify(body));
}

async function listen(server) {
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    return server.address().port;
}

async function availablePort() {
    const probe = net.createServer();
    const port = await listen(probe);
    await closeServer(probe);
    return port;
}

async function closeServer(server) {
    if (!server.listening) return;
    await new Promise((resolve) => server.close(resolve));
}

async function waitForPortClosed(port) {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
        if (!(await isPortOpen(port))) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Temporary test port ${port} is still open after cleanup`);
}

function isPortOpen(port) {
    return new Promise((resolve) => {
        const socket = net.connect({host: "127.0.0.1", port});
        socket.setTimeout(500);
        socket.once("connect", () => {
            socket.destroy();
            resolve(true);
        });
        socket.once("error", () => resolve(false));
        socket.once("timeout", () => {
            socket.destroy();
            resolve(false);
        });
    });
}

async function stopProcess(child) {
    if (child.exitCode !== null) return;

    if (process.platform === "win32") {
        await new Promise((resolve) => {
            const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {stdio: "ignore"});
            killer.once("exit", resolve);
            killer.once("error", resolve);
        });
    } else {
        child.kill("SIGTERM");
    }

    await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
}
