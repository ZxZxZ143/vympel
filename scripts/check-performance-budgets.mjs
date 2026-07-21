import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireBuild = process.argv.includes("--require-build");
const MiB = 1024 * 1024;
const budgets = {
  publicAssets: 24 * MiB,
  publicRaster: 1.5 * MiB,
  storefrontJs: 1.65 * MiB,
  crmJs: 1.40 * MiB,
};
const allowlist = JSON.parse(fs.readFileSync(path.join(root, "scripts", "performance-budget-allowlist.json"), "utf8"));
const rasterExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
const failures = [];

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

function bytes(files) {
  return files.reduce((total, file) => total + fs.statSync(file).size, 0);
}

function format(value) {
  return `${(value / MiB).toFixed(2)} MiB`;
}

function validateAllowlist() {
  const today = new Date().toISOString().slice(0, 10);
  for (const item of allowlist.publicRasterExceptions ?? []) {
    if (!item.path || !item.owner || !item.reason || !item.expires || item.expires < today || !Number.isFinite(item.maxBytes)) {
      failures.push(`invalid or expired raster budget exception: ${JSON.stringify(item)}`);
    }
  }
}

function checkRasterFile(file, targetFailures, exceptions = allowlist.publicRasterExceptions ?? []) {
  const size = fs.statSync(file).size;
  if (size <= budgets.publicRaster) return;
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const exception = exceptions.find((item) => item.path === relative);
  if (!exception || size > exception.maxBytes) {
    targetFailures.push(`${relative} is ${format(size)} (raster limit ${format(budgets.publicRaster)})`);
  }
}

function verifyBudgetDetector() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vympel-asset-budget-"));
  const fixture = path.join(fixtureRoot, "oversized-fixture.png");
  try {
    fs.writeFileSync(fixture, Buffer.alloc(budgets.publicRaster + 1));
    const detected = [];
    checkRasterFile(fixture, detected, []);
    if (detected.length !== 1) throw new Error("asset budget did not reject the oversized fixture");

    const relative = path.relative(root, fixture).replaceAll("\\", "/");
    const explicitlyAllowed = [];
    checkRasterFile(fixture, explicitlyAllowed, [{
      path: relative,
      maxBytes: budgets.publicRaster + 1,
      owner: "budget-self-test",
      reason: "prove explicit exceptions are honored",
      expires: "2099-01-01",
    }]);
    if (explicitlyAllowed.length !== 0) throw new Error("documented asset budget exception was not honored");
  } finally {
    fs.rmSync(fixtureRoot, {recursive: true, force: true});
  }
  console.log("asset budget detector self-test: oversized fixture rejected; explicit exception honored");
}

function checkPublicAssets() {
  const publicRoot = path.join(root, "vympel_front", "public");
  const allFiles = filesUnder(publicRoot);
  const total = bytes(allFiles);
  console.log(`public assets: ${format(total)} / ${format(budgets.publicAssets)}`);
  if (total > budgets.publicAssets) failures.push(`public assets exceed ${format(budgets.publicAssets)}`);

  for (const file of allFiles.filter((candidate) => rasterExtensions.has(path.extname(candidate).toLowerCase()))) {
    checkRasterFile(file, failures);
  }
}

function checkBuiltJs(app, limit) {
  const chunks = path.join(root, app, ".next", "static", "chunks");
  if (!fs.existsSync(chunks)) {
    const message = `${app} build output is missing`;
    if (requireBuild) failures.push(message);
    else console.log(`${message}; JS budget skipped (use --require-build in CI)`);
    return;
  }
  const total = bytes(filesUnder(chunks).filter((file) => file.endsWith(".js")));
  console.log(`${app} static JS: ${format(total)} / ${format(limit)}`);
  if (total > limit) failures.push(`${app} static JS exceeds ${format(limit)}`);
}

validateAllowlist();
verifyBudgetDetector();
checkPublicAssets();
checkBuiltJs("vympel_front", budgets.storefrontJs);
checkBuiltJs("vympel_crm", budgets.crmJs);

if (failures.length) {
  console.error("Performance budget failures:\n- " + failures.join("\n- "));
  process.exitCode = 1;
} else {
  console.log("Performance budgets passed.");
}
