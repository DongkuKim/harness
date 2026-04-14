import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const options = {
    template: "",
    targetRoot: "",
    needsPython: false,
    needsRust: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--template") {
      options.template = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--target-root") {
      options.targetRoot = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--needs-python") {
      options.needsPython = true;
      continue;
    }

    if (arg === "--needs-rust") {
      options.needsRust = true;
    }
  }

  if (!options.template) {
    throw new Error("Missing required --template argument.");
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

const options = parseArgs(process.argv.slice(2));
const targetRoot = options.targetRoot ? path.resolve(options.targetRoot) : os.tmpdir();
mkdirSync(targetRoot, { recursive: true });
const tempRoot = mkdtempSync(path.join(targetRoot, `${options.template}-`));

try {
  console.log(`Scaffold evaluation for ${options.template}`);

  const packDir = path.join(tempRoot, "pack");
  const scaffoldRoot = path.join(tempRoot, "scaffold");
  mkdirSync(packDir, { recursive: true });
  mkdirSync(scaffoldRoot, { recursive: true });

  console.log("Packing npm tarball...");
  const packOutput = run("npm", ["pack", "--json", "--pack-destination", packDir]);
  const [packResult] = JSON.parse(packOutput.stdout);
  const tarballPath = path.join(packDir, packResult.filename);

  const scaffoldDir = path.join(scaffoldRoot, options.template);
  console.log(`Scaffolding ${options.template} into ${scaffoldDir}`);
  run("npm", [
    "exec",
    "--yes",
    "--package",
    tarballPath,
    "--",
    "dk-harness",
    "new",
    options.template,
    scaffoldDir,
  ]);

  assert(
    existsSync(path.join(scaffoldDir, ".github", "workflows", "ci.yml")),
    `Expected scaffolded ${options.template} project to include .github/workflows/ci.yml.`,
  );

  console.log(`Installing Node dependencies in ${scaffoldDir}`);
  run("pnpm", ["install", "--frozen-lockfile"], { cwd: scaffoldDir });

  if (options.needsPython) {
    console.log("Syncing Python dependencies");
    run("uv", ["sync", "--group", "dev"], { cwd: path.join(scaffoldDir, "apps", "api") });
  }

  if (options.needsRust) {
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

  console.log(`scaffold:evaluate passed for ${options.template}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
