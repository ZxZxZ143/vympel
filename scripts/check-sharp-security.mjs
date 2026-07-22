import { spawnSync } from "node:child_process";

const minimumSharpVersion = "0.35.0";
const npmCommand = process.env.npm_execpath ? process.execPath : "npm";
const npmArguments = process.env.npm_execpath ? [process.env.npm_execpath] : [];

function runNpmLs(args) {
  return spawnSync(npmCommand, [...npmArguments, "ls", ...args], {
    encoding: "utf8",
    shell: false,
  });
}

function printResult(result) {
  if (result.error) {
    console.error(result.error.message);
  }
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

function collectDependencyVersions(node, dependencyName, path = [], found = []) {
  for (const [name, dependency] of Object.entries(node?.dependencies ?? {})) {
    const dependencyPath = [...path, `${name}@${dependency.version ?? "unknown"}`];

    if (name === dependencyName) {
      found.push({ path: dependencyPath.join(" > "), version: dependency.version });
    }

    collectDependencyVersions(dependency, dependencyName, dependencyPath, found);
  }

  return found;
}

function parseStableVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? "");

  if (!match) {
    throw new Error(`Expected a stable semantic version, received ${version ?? "unknown"}`);
  }

  return match.slice(1).map(Number);
}

function isAtLeast(version, minimum) {
  const actualParts = parseStableVersion(version);
  const minimumParts = parseStableVersion(minimum);

  for (let index = 0; index < actualParts.length; index += 1) {
    if (actualParts[index] !== minimumParts[index]) {
      return actualParts[index] > minimumParts[index];
    }
  }

  return true;
}

const displayResult = runNpmLs(["next", "sharp", "--all"]);
printResult(displayResult);

if (displayResult.status !== 0) {
  console.error("Unable to inspect the installed Next.js/sharp dependency graph.");
  process.exit(displayResult.status ?? 1);
}

const jsonResult = runNpmLs(["next", "sharp", "--all", "--json"]);

if (jsonResult.status !== 0) {
  printResult(jsonResult);
  console.error("Unable to read the installed dependency graph as JSON.");
  process.exit(jsonResult.status ?? 1);
}

let graph;

try {
  graph = JSON.parse(jsonResult.stdout);
} catch (error) {
  console.error(`Unable to parse npm dependency output: ${error.message}`);
  process.exit(1);
}

const sharpDependencies = collectDependencyVersions(graph, "sharp");

if (sharpDependencies.length === 0) {
  console.error("No installed sharp dependency was found; Next.js image optimization is not verified.");
  process.exit(1);
}

const insecureDependencies = sharpDependencies.filter(
  ({ version }) => !isAtLeast(version, minimumSharpVersion),
);

if (insecureDependencies.length > 0) {
  console.error(`Installed sharp must be >=${minimumSharpVersion}:`);
  for (const dependency of insecureDependencies) {
    console.error(`- ${dependency.path}`);
  }
  process.exit(1);
}

console.log(
  `Verified ${sharpDependencies.length} installed sharp dependency path(s) at >=${minimumSharpVersion}.`,
);
