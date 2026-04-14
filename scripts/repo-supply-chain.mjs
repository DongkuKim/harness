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

console.log("Running gitleaks...");
run("gitleaks", ["dir", ".", "--config", ".gitleaks.toml"]);

console.log("Running osv-scanner...");
run("osv-scanner", [
  "scan",
  "source",
  ".",
  "--recursive",
  "--allow-no-lockfiles",
  "--experimental-exclude",
  "templates",
]);

console.log("Running npm audit...");
run("npm", ["audit", "--audit-level=high"]);

console.log("repo:supply-chain passed");
