import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const minimatchPackagePath = resolve("node_modules/minimatch/package.json");
const minimatchSourcePath = resolve("node_modules/minimatch/minimatch.js");
const braceExpansionPackagePath = resolve("node_modules/brace-expansion/package.json");
const legacyImport = "var expand = require('brace-expansion')";
const compatibleImport = `var braceExpansion = require('brace-expansion')
var expand = typeof braceExpansion === 'function'
  ? braceExpansion
  : braceExpansion.expand`;

const minimatchPackage = JSON.parse(readFileSync(minimatchPackagePath, "utf8"));
const braceExpansionPackage = JSON.parse(readFileSync(braceExpansionPackagePath, "utf8"));

if (minimatchPackage.version !== "3.1.5") {
  throw new Error(
    `Expected minimatch 3.1.5 for the compatibility patch, found ${minimatchPackage.version}.`,
  );
}

if (braceExpansionPackage.version !== "5.0.8") {
  throw new Error(
    `Expected the patched brace-expansion 5.0.8 release, found ${braceExpansionPackage.version}.`,
  );
}

const source = readFileSync(minimatchSourcePath, "utf8");

if (source.includes(legacyImport)) {
  writeFileSync(minimatchSourcePath, source.replace(legacyImport, compatibleImport));
} else if (!source.includes(compatibleImport)) {
  throw new Error("The minimatch brace-expansion import no longer matches the reviewed source.");
}

const minimatch = require(minimatchSourcePath);

if (!minimatch("catalog/product", "catalog/**")) {
  throw new Error("The patched minimatch compatibility check failed.");
}

console.log("Verified minimatch 3.1.5 with patched brace-expansion 5.0.8.");
