import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {readFile, readdir} from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
await readFile(path.join(root, ".next", "BUILD_ID"), "utf8").catch(() => {
  throw new Error("Production build is missing. Run `npm run build` first.");
});
const port = await availablePort();
const output = [];
const child = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)], {
  cwd: root,
  env: {...process.env, SECURITY_HEADERS_CSP_MODE: "enforce"},
  stdio: ["ignore", "pipe", "pipe"],
});
for (const stream of [child.stdout, child.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => output.push(chunk));
}

try {
  const origin = `http://127.0.0.1:${port}`;
  await waitForServer(origin, child, output);
  await expectHeaders(`${origin}/login`, 200);
  await expectHeaders(`${origin}/api/telemetry`);
  const staticChunk = (await readdir(path.join(root, ".next", "static", "chunks")))
    .find((name) => name.endsWith(".js"));
  assert.ok(staticChunk, "production build must contain a static JS chunk");
  await expectHeaders(`${origin}/_next/static/chunks/${staticChunk}`);
  console.log("CRM production security headers passed.");
} finally {
  await stopProcess(child);
  await waitForPortClosed(port);
}

async function expectHeaders(url, expectedStatus) {
  const response = await fetch(url, {redirect: "manual"});
  const csp = response.headers.get("content-security-policy");
  if (expectedStatus) assert.equal(response.status, expectedStatus);
  assert.ok(csp);
  assert.doesNotMatch(csp, /unsafe-eval|(?:^|\s)\*(?:\s|;|$)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.equal(response.headers.get("strict-transport-security"), null);
}

async function waitForServer(origin, child, logs) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next.js exited before readiness.\n${logs.join("")}`);
    try {
      const response = await fetch(`${origin}/login`, {signal: AbortSignal.timeout(1_000)});
      if (response.status < 500) return;
    } catch {
      // Bounded readiness retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Next.js did not become ready.\n${logs.join("")}`);
}

async function availablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForPortClosed(port) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const open = await new Promise((resolve) => {
      const socket = net.connect({host: "127.0.0.1", port});
      socket.setTimeout(500);
      socket.once("connect", () => { socket.destroy(); resolve(true); });
      socket.once("error", () => resolve(false));
      socket.once("timeout", () => { socket.destroy(); resolve(false); });
    });
    if (!open) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Temporary CRM port ${port} is still open after cleanup`);
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
