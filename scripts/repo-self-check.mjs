import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

console.log("Compiling the published Python CLI...");
run("python3", ["-m", "py_compile", "bin/dk-harness"]);

console.log("Validating module manifests...");
run("npm", ["run", "modules:check"]);

console.log("Checking generated scaffold freshness...");
run("npm", ["run", "fixtures:check"]);

console.log("Checking the local CLI command surface...");
run("./bin/dk-harness", ["list"]);

console.log("Running release packaging verification...");
run("npm", ["run", "release:check"]);

console.log("repo:self-check passed");
