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
    const staticChunk = (await readdir(path.join(root, ".next", "static", "chunks")))
        .find((name) => name.endsWith(".js"));
    assert.ok(staticChunk, "production build must contain a static JS chunk");
    await expectSecurityHeaders(origin, `/_next/static/chunks/${staticChunk}`);

    await expectStatusAndText(origin, "/ru", 200);
    await expectStatusAndText(origin, "/ru/product/1", 200, "Integration product");
    await expectStatusAndText(origin, "/ru/catalog?categoryCode=WATCH_WRIST", 200);
    await expectStatusAndText(origin, "/ru/brands/romanson", 200, "ROMANSON");

    for (const locale of locales) {
        await expectStatusAndText(
            origin,
            `/${locale}/route-that-does-not-exist`,
            404,
            notFoundTitles[locale]
        );
    }

    await expectStatusAndText(origin, "/ru/product/999", 404, notFoundTitles.ru);
    await expectStatusAndText(
        origin,
        "/ru/catalog?categoryCode=MISSING_CATEGORY",
        404,
        notFoundTitles.ru
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
            return json(response, 200, product());
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
            return json(response, 200, page([]));
        }
        if (/^\/api\/public\/product\/filters\/(ru|kz|en)$/.test(pathname)) {
            return json(response, 200, catalogFilters());
        }

        const categoryMatch = pathname.match(/^\/api\/public\/category\/(ru|kz|en)\/([^/]+)$/);
        if (categoryMatch) {
            const code = categoryMatch[2];
            if (code === "MISSING_CATEGORY") return json(response, 404, apiError(404, "Resource not found."));
            if (code === "TEMPORARY_FAILURE") return json(response, 500, apiError(500, "Unexpected server error."));
            return json(response, 200, category(code));
        }

        if (/^\/api\/public\/category\/all\/(ru|kz|en)$/.test(pathname)) {
            return json(response, 200, [category("WATCH_WRIST")]);
        }

        if (/^\/api\/public\/cms\/pages\//.test(pathname)) {
            return json(response, 200, {pageKey: pathname.split("/").at(-1), blocks: []});
        }

        return json(response, 404, apiError(404, "Resource not found."));
    });
}

function product() {
    return {
        id: 1,
        sku: "INTEGRATION-1",
        name: "Integration product",
        model: "Status matrix",
        price: 100000,
        stockQuantity: 1,
        status: "ACTIVE",
        productType: "WATCH",
        category: {id: 1, name: "Wrist watches", code: "WATCH_WRIST", parentId: null},
        brand: {id: "1", name: "Romanson", country: []},
        collection: null,
        images: [],
        description: null,
        watchDetails: null,
        interiorClockDetails: null,
        kaspiUrl: null,
        wildberriesUrl: null,
        ratingAverage: null,
        ratingCount: 0,
    };
}

function category(code) {
    return {id: 1, name: "Wrist watches", code, parent: null, parentId: null};
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

function page(content) {
    return {
        content,
        empty: content.length === 0,
        first: true,
        last: true,
        number: 0,
        numberOfElements: content.length,
        size: Math.max(content.length, 1),
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
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
