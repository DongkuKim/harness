import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const presetsRoot = path.join(repoRoot, "scaffolds", "presets");
const modulesRoot = path.join(repoRoot, "templates", "modules");

const preferredPresetOrder = [
  "next-monorepo",
  "package-nextjs-ui-kit",
  "next-nextjs-api-monorepo",
  "next-fastapi-monorepo",
  "next-axum-monorepo",
  "next-fastapi-axum-monorepo",
  "next-2x-fastapi-monorepo",
];

const preferredPresetIndex = new Map(
  preferredPresetOrder.map((presetName, index) => [presetName, index]),
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }

  return result.stdout ?? "";
}

function normalizeRepoPath(repoPath) {
  return repoPath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function moduleName(moduleSpec) {
  return moduleSpec.split(":", 1)[0];
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function loadModuleMetadata(moduleId) {
  const modulePath = path.join(modulesRoot, moduleId, "module.json");
  const moduleManifest = readJson(modulePath);
  return moduleManifest.check_metadata ?? {};
}

function loadPresets() {
  return readdirSync(presetsRoot)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => readJson(path.join(presetsRoot, entry)))
    .sort((left, right) => {
      const leftIndex = preferredPresetIndex.get(left.name) ?? Number.POSITIVE_INFINITY;
      const rightIndex = preferredPresetIndex.get(right.name) ?? Number.POSITIVE_INFINITY;

      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return left.name.localeCompare(right.name);
    });
}

function checkMetadataForPreset(preset) {
  const moduleMetadata = preset.modules.map((moduleSpec) =>
    loadModuleMetadata(moduleName(moduleSpec)),
  );

  return {
    needs_python: moduleMetadata.some((metadata) => metadata.needs_python === true),
    needs_rust: moduleMetadata.some((metadata) => metadata.needs_rust === true),
  };
}

function buildMatrices() {
  const presets = loadPresets().map((preset) => {
    const checkMetadata = checkMetadataForPreset(preset);
    return {
      name: preset.name,
      ...checkMetadata,
    };
  });

  return {
    fixtures: presets.map((preset) => ({
      ...preset,
      path: `scaffolds/generated/${preset.name}`,
    })),
    presets,
  };
}

function readEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    return {};
  }

  return readJson(eventPath);
}

function splitChangedFiles(changedFiles) {
  return changedFiles
    .split(/\r?\n/)
    .map((entry) => normalizeRepoPath(entry.trim()))
    .filter(Boolean);
}

function changedFilesFromGit(eventPayload) {
  const baseSha = eventPayload.pull_request?.base?.sha;
  const headSha = eventPayload.pull_request?.head?.sha;
  if (!baseSha) {
    return null;
  }

  const diffPairs = [
    headSha ? [baseSha, headSha] : null,
    [baseSha, "HEAD"],
  ].filter(Boolean);

  for (const diffPair of diffPairs) {
    try {
      return splitChangedFiles(run("git", ["diff", "--name-only", ...diffPair]));
    } catch (error) {
      console.warn(error.message);
    }
  }

  return null;
}

function changedFilesForCurrentRun() {
  if (process.env.SCAFFOLD_CI_CHANGED_FILES !== undefined) {
    return splitChangedFiles(process.env.SCAFFOLD_CI_CHANGED_FILES);
  }

  const eventName = process.env.GITHUB_EVENT_NAME ?? "";
  if (eventName !== "pull_request") {
    return [];
  }

  return changedFilesFromGit(readEventPayload());
}

function presetFileUsesAxum(repoPath) {
  if (!repoPath.startsWith("scaffolds/presets/") || !repoPath.endsWith(".json")) {
    return false;
  }

  if (repoPath.includes("axum")) {
    return true;
  }

  const absolutePath = path.join(repoRoot, repoPath);
  if (!existsSync(absolutePath)) {
    return false;
  }

  const preset = readJson(absolutePath);
  return preset.modules?.some((moduleSpec) => moduleName(moduleSpec) === "backend-axum") === true;
}

function isAxumRelevantPath(repoPath) {
  return (
    repoPath.startsWith("templates/modules/backend-axum/") ||
    repoPath.startsWith("scaffolds/generated/next-axum-monorepo/") ||
    repoPath.startsWith("scaffolds/generated/next-fastapi-axum-monorepo/") ||
    presetFileUsesAxum(repoPath)
  );
}

function shouldIncludeAxum(changedFiles) {
  const eventName = process.env.GITHUB_EVENT_NAME ?? "";
  if (eventName !== "pull_request") {
    return true;
  }

  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return true;
  }

  return changedFiles.some(isAxumRelevantPath);
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

const matrices = buildMatrices();
const changedFiles = changedFilesForCurrentRun();
const includeAxum = shouldIncludeAxum(changedFiles);
const selectedFixtures = includeAxum
  ? matrices.fixtures
  : matrices.fixtures.filter((fixture) => fixture.needs_rust !== true);
const selectedPresets = includeAxum
  ? matrices.presets
  : matrices.presets.filter((preset) => preset.needs_rust !== true);

console.log(`Axum entries: ${includeAxum ? "included" : "skipped"}`);
console.log(`Fixture entries: ${selectedFixtures.map((fixture) => fixture.name).join(", ")}`);
console.log(`Preset entries: ${selectedPresets.map((preset) => preset.name).join(", ")}`);

writeOutput("include_axum", String(includeAxum));
writeOutput("fixtures", JSON.stringify(selectedFixtures));
writeOutput("presets", JSON.stringify(selectedPresets));
