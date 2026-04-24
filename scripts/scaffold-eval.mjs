import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const options = {
    preset: "",
    targetRoot: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--preset") {
      options.preset = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--target-root") {
      options.targetRoot = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

  }

  if (!options.preset) {
    throw new Error("Missing required --preset argument.");
  }

  return options;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
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
        `Command failed in ${options.cwd ?? repoRoot}: ${command} ${args.join(" ")}`,
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

function packageNextjsIds(modules) {
  return modules
    .filter(
      (moduleSpec) => moduleSpec === "package-nextjs" || moduleSpec.startsWith("package-nextjs:"),
    )
    .map((moduleSpec) => moduleSpec.split(":", 2)[1] ?? "ui-kit");
}

function tarballPathFromPackOutput(packOutput, packDir) {
  const payload = JSON.parse(packOutput.stdout);
  const filename = Array.isArray(payload) ? payload[0]?.filename : payload.filename;

  assert(typeof filename === "string" && filename.length > 0, "Expected pack output to include a filename.");
  return path.isAbsolute(filename) ? filename : path.join(packDir, filename);
}

const options = parseArgs(process.argv.slice(2));
const targetRoot = options.targetRoot ? path.resolve(options.targetRoot) : os.tmpdir();
mkdirSync(targetRoot, { recursive: true });
const tempRoot = mkdtempSync(path.join(targetRoot, `${options.preset}-`));

try {
  console.log(`Scaffold evaluation for ${options.preset}`);

  const packDir = path.join(tempRoot, "pack");
  const scaffoldRoot = path.join(tempRoot, "scaffold");
  mkdirSync(packDir, { recursive: true });
  mkdirSync(scaffoldRoot, { recursive: true });

  console.log("Packing package tarball with pnpm...");
  const packOutput = run("pnpm", ["pack", "--json", "--pack-destination", packDir]);
  const tarballPath = tarballPathFromPackOutput(packOutput, packDir);

  const presetPath = path.join(repoRoot, "scaffolds", "presets", `${options.preset}.json`);
  const preset = JSON.parse(readFileSync(presetPath, "utf8"));

  const scaffoldDir = path.join(scaffoldRoot, options.preset);
  console.log(`Scaffolding ${options.preset} into ${scaffoldDir}`);
  run("pnpm", [
    "--package",
    tarballPath,
    "dlx",
    "dk-harness",
    "new",
    scaffoldDir,
    ...preset.modules.flatMap((moduleSpec) => ["--module", moduleSpec]),
  ]);

  assert(
    existsSync(path.join(scaffoldDir, ".github", "workflows", "ci.yml")),
    `Expected scaffolded ${options.preset} project to include .github/workflows/ci.yml.`,
  );

  console.log(`Installing Node dependencies in ${scaffoldDir}`);
  run("pnpm", ["install"], { cwd: scaffoldDir });

  const appsDir = path.join(scaffoldDir, "apps");
  const appEntries = existsSync(appsDir)
    ? readdirSync(appsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];
  const pythonApps = appEntries.filter((appName) =>
    existsSync(path.join(scaffoldDir, "apps", appName, "pyproject.toml")),
  );
  const rustApps = appEntries.filter((appName) =>
    existsSync(path.join(scaffoldDir, "apps", appName, "Cargo.toml")),
  );

  if (pythonApps.length > 0) {
    console.log("Syncing Python dependencies");
    for (const appName of pythonApps) {
      run("uv", ["sync", "--group", "dev"], { cwd: path.join(scaffoldDir, "apps", appName) });
    }
  }

  if (rustApps.length > 0) {
    console.log("Installing Rust tools needed by the generated harness");
    run("rustup", ["toolchain", "install", "nightly", "--component", "rust-src"], {
      cwd: scaffoldDir,
    });
    run("cargo", ["install", "cargo-nextest", "cargo-udeps", "--locked"], {
      cwd: scaffoldDir,
    });
  }

  console.log("Running generated repo checks");
  run("just", ["lint"], { cwd: scaffoldDir });
  run("just", ["typecheck"], { cwd: scaffoldDir });
  run("just", ["test"], { cwd: scaffoldDir });
  for (const packageId of packageNextjsIds(preset.modules)) {
    run("pnpm", ["--filter", `@workspace/${packageId}`, "build"], { cwd: scaffoldDir });
    run("pnpm", ["--filter", `@workspace/${packageId}`, "storybook:build"], { cwd: scaffoldDir });
  }

  console.log(`scaffold:evaluate passed for ${options.preset}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
