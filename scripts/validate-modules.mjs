import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulesRoot = path.join(repoRoot, "templates", "modules");

const requiredFields = [
  "name",
  "kind",
  "runtime",
  "repeatable",
  "requires",
  "conflicts",
  "emits",
  "check_metadata",
  "documentation",
];

const errors = [];
const seenNames = new Set();

function exists(relativePath) {
  try {
    statSync(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

for (const moduleDir of readdirSync(modulesRoot, { withFileTypes: true })) {
  if (!moduleDir.isDirectory()) {
    continue;
  }

  const manifestRelativePath = path.posix.join("templates/modules", moduleDir.name, "module.json");
  if (!exists(manifestRelativePath)) {
    errors.push(`${moduleDir.name}: missing module.json`);
    continue;
  }

  const payload = JSON.parse(readFileSync(path.join(repoRoot, manifestRelativePath), "utf8"));

  for (const fieldName of requiredFields) {
    if (!(fieldName in payload)) {
      errors.push(`${moduleDir.name}: missing required field ${fieldName}`);
    }
  }

  if (typeof payload.name !== "string" || payload.name.length === 0) {
    errors.push(`${moduleDir.name}: name must be a non-empty string`);
  } else if (seenNames.has(payload.name)) {
    errors.push(`${moduleDir.name}: duplicate module name ${payload.name}`);
  } else {
    seenNames.add(payload.name);
  }

  if (!Array.isArray(payload.emits) || payload.emits.length === 0) {
    errors.push(`${moduleDir.name}: emits must be a non-empty array`);
  } else {
    let hasRepeatableAppTarget = false;
    for (const emit of payload.emits) {
      if (typeof emit.source !== "string" || typeof emit.target !== "string") {
        errors.push(`${moduleDir.name}: each emit must include string source and target`);
        continue;
      }

      const sourceRelativePath = path.posix.join("templates/modules", moduleDir.name, emit.source);
      if (!exists(sourceRelativePath)) {
        errors.push(`${moduleDir.name}: missing emitted source ${emit.source}`);
      }

      if (payload.repeatable && emit.target.includes("__APP_ID__")) {
        hasRepeatableAppTarget = true;
      }
    }

    if (payload.repeatable && !hasRepeatableAppTarget) {
      errors.push(`${moduleDir.name}: repeatable modules must emit at least one __APP_ID__ path`);
    }
  }

  if (typeof payload.repeatable !== "boolean") {
    errors.push(`${moduleDir.name}: repeatable must be a boolean`);
  }

  if (!Array.isArray(payload.requires) || !Array.isArray(payload.conflicts)) {
    errors.push(`${moduleDir.name}: requires and conflicts must be arrays`);
  }

  if (
    typeof payload.documentation !== "object" ||
    payload.documentation === null ||
    typeof payload.documentation.app_summary !== "string"
  ) {
    errors.push(`${moduleDir.name}: documentation.app_summary must be a string`);
  }
}

if (!seenNames.has("core-monorepo")) {
  errors.push("core-monorepo: required foundational module is missing");
}

if (errors.length > 0) {
  console.error("modules:check failed");
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exitCode = 1;
} else {
  console.log("modules:check passed");
}
