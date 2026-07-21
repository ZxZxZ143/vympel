import {existsSync} from "node:fs";
import http from "node:http";

const target = process.env.REHEARSAL_TARGET_URL ?? "http://storefront-app:3000/api/revalidate";
const delayMarker = "/tmp/vympel-revalidation-delay";

const server = http.createServer(async (request, response) => {
    if (request.url === "/healthz") {
        response.writeHead(200, {"content-type": "text/plain"});
        response.end("ok");
        return;
    }
    if (request.method !== "POST" || request.url !== "/api/revalidate") {
        response.writeHead(404);
        response.end();
        return;
    }

    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    try {
        if (existsSync(delayMarker)) {
            await new Promise((resolve) => setTimeout(resolve, 2_000));
        }
        const upstream = await fetch(target, {
            method: "POST",
            headers: {
                "content-type": request.headers["content-type"] ?? "application/json",
                "x-cms-signature": request.headers["x-cms-signature"] ?? "",
            },
            body,
            signal: AbortSignal.timeout(5_000),
        });
        response.writeHead(upstream.status, {
            "content-type": upstream.headers.get("content-type") ?? "application/json",
        });
        response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
        response.writeHead(502, {"content-type": "application/json"});
        response.end('{"ok":false,"error":"upstream unavailable"}');
    }
});

server.listen(3000, "0.0.0.0");
