import assert from "node:assert/strict";
import {createRequire} from "node:module";

// The published upstream braces 3.0.3 has no depth bound (GHSA-vfj7-8cjw-p6xm).
// This pinned derivative contains the reviewed parse/AST guards, not an audit exemption.
const require = createRequire(import.meta.url);
const globRequire = createRequire(require.resolve("micromatch"));
const braces = globRequire("braces");
const packageInfo = globRequire("braces/package.json");
assert.equal(packageInfo.name, "@dieub/braces-depth-guard");
assert.equal(packageInfo.version, "3.0.3-pn.0");
assert.deepEqual(braces.expand("src/{app,features}/**/*.{ts,tsx}"), [
  "src/app/**/*.ts", "src/app/**/*.tsx", "src/features/**/*.ts", "src/features/**/*.tsx",
]);
assert.deepEqual(braces.expand("{01..03}"), ["01", "02", "03"]);
for (const operation of [braces, braces.parse, braces.compile, braces.expand, braces.stringify]) {
  for (const [open, close] of [["{", "}"], ["(", ")"]]) {
    assert.throws(() => operation(open.repeat(4000) + "a" + close.repeat(4000)), /exceeds max depth/);
  }
}
for (const operation of [braces.compile, braces.expand, braces.stringify]) {
  let ast = {type: "text", value: "a"};
  for (let depth = 0; depth < 200; depth++) ast = {type: "paren", nodes: [ast]};
  assert.throws(() => operation({type: "root", nodes: [ast]}), /exceeds max depth/);
}
console.log("Verified reviewed braces depth guards and normal glob/range compatibility.");
