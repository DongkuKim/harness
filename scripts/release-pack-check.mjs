import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stdout = result.stdout?.trim();
    const stderr = result.stderr?.trim();
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        stdout ? `stdout:\n${stdout}` : null,
        stderr ? `stderr:\n${stderr}` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredTarEntries = [
  "package/bin/dk-harness",
  "package/bin/dk_harness_compose.py",
  "package/README.md",
  "package/LICENSE",
  "package/templates/modules/core-monorepo/module.json",
  "package/templates/modules/frontend-nextjs/module.json",
];

const tempRoot = mkdtempSync(path.join(os.tmpdir(), "dk-harness-release-"));

try {
  console.log("Checking python3 availability...");
  run("python3", ["--version"]);

  const packDir = path.join(tempRoot, "pack");
  const scaffoldDir = path.join(tempRoot, "scaffold");
  mkdirSync(packDir, { recursive: true });
  mkdirSync(scaffoldDir, { recursive: true });

  console.log("Packing npm tarball...");
  const packOutput = run("npm", ["pack", "--json", "--pack-destination", packDir]);
  const [packResult] = JSON.parse(packOutput.stdout);
  const tarballPath = path.join(packDir, packResult.filename);

  console.log(`Inspecting tarball contents: ${tarballPath}`);
  const tarEntries = new Set(
    run("tar", ["-tf", tarballPath]).stdout.split("\n").filter(Boolean),
  );

  for (const entry of requiredTarEntries) {
    assert(tarEntries.has(entry), `Missing required tarball entry: ${entry}`);
  }

  console.log("Running installed package smoke test: list");
  const listOutput = run("npm", [
    "exec",
    "--yes",
    "--package",
    tarballPath,
    "--",
    "dk-harness",
    "list",
  ]);
  assert(
    listOutput.stdout.includes("Available modules:"),
    "Expected module list output from packaged CLI.",
  );

  assert(
    !Array.from(tarEntries).some((entry) => entry.startsWith("package/scaffolds/generated/")),
    "Committed generated scaffold fixtures should not be included in the npm tarball.",
  );

  const presetsRoot = path.join(repoRoot, "scaffolds", "presets");
  const presetEntries = run("find", [presetsRoot, "-maxdepth", "1", "-type", "f", "-name", "*.json"])
    .stdout.split("\n")
    .filter(Boolean)
    .sort();

  for (const presetPath of presetEntries) {
    const preset = JSON.parse(readFileSync(presetPath, "utf8"));
    const targetDir = path.join(scaffoldDir, preset.name);

    console.log(`Running installed package smoke test: scaffold ${preset.name}`);
    run("npm", [
      "exec",
      "--yes",
      "--package",
      tarballPath,
      "--",
      "dk-harness",
      "new",
      targetDir,
      ...preset.modules.flatMap((moduleSpec) => ["--module", moduleSpec]),
    ]);

    assert(
      existsSync(path.join(targetDir, ".github", "workflows", "ci.yml")),
      `Expected scaffolded ${preset.name} project to include .github/workflows/ci.yml.`,
    );
  }

  console.log("release:check passed");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
