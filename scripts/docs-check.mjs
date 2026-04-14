import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ROOT_REQUIRED_FILES = [
  "README.md",
  "AGENTS.md",
  "ARCHITECTURE.md",
  "docs/README.md",
  "docs/CI.md",
  "docs/EXPECTATIONS.md",
  "docs/RELEASE.md",
];

const TEMPLATE_REQUIRED_FILES = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "README.md",
  "justfile",
  "mise.toml",
  "docs/DESIGN.md",
  "docs/FRONTEND.md",
  "docs/PLANS.md",
  "docs/PRODUCT_SENSE.md",
  "docs/QUALITY_SCORE.md",
  "docs/RELIABILITY.md",
  "docs/SECURITY.md",
  "docs/design-docs/index.md",
  "docs/design-docs/core-beliefs.md",
  "docs/design-docs/included-skills.md",
  "docs/exec-plans/repeated-work.md",
  "docs/exec-plans/tech-debt-tracker.md",
  "docs/generated/db-schema.md",
  "docs/product-specs/index.md",
  "docs/product-specs/new-user-onboarding.md",
];

const STACK_KEYWORDS = {
  nextjs: /Next\.js/i,
  fastapi: /FastAPI/i,
  axum: /Axum/i,
};

const RUNTIME_TOOLS = {
  node: ["node", "pnpm"],
  python: ["python", "uv"],
  rust: ["rust"],
};

const errors = [];

function readText(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(relativePath) {
  try {
    statSync(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

function report(message) {
  errors.push(message);
}

function walkMarkdown(relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childRelativePath = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (childRelativePath.includes("/references")) {
        continue;
      }
      files.push(...walkMarkdown(childRelativePath));
      continue;
    }

    if (entry.name.endsWith(".md")) {
      files.push(childRelativePath);
    }
  }

  return files;
}

function collectMarkdownFiles() {
  return [
    "README.md",
    "AGENTS.md",
    "ARCHITECTURE.md",
    ...walkMarkdown("docs"),
    ...walkMarkdown("templates"),
  ];
}

function validateRequiredFiles(relativeFiles, label) {
  for (const relativePath of relativeFiles) {
    if (!exists(relativePath)) {
      report(`${label}: missing required file ${relativePath}`);
    }
  }
}

function validateMarkdownLinks(relativePath) {
  const contents = readText(relativePath);
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of contents.matchAll(linkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (
      rawTarget.startsWith("http://") ||
      rawTarget.startsWith("https://") ||
      rawTarget.startsWith("mailto:") ||
      rawTarget.startsWith("tel:") ||
      rawTarget.startsWith("#")
    ) {
      continue;
    }

    if (rawTarget.startsWith("/")) {
      report(`${relativePath}: unsupported absolute link target ${rawTarget}`);
      continue;
    }

    const [targetPath] = rawTarget.split("#", 1);
    const normalizedTarget = decodeURIComponent(targetPath);
    const resolvedPath = path.resolve(path.dirname(path.join(repoRoot, relativePath)), normalizedTarget);

    if (!exists(path.relative(repoRoot, resolvedPath))) {
      report(`${relativePath}: broken relative link ${rawTarget}`);
    }
  }
}

function parseJustTargets(relativePath) {
  const contents = readText(relativePath);
  const targets = new Set();

  for (const match of contents.matchAll(/^([A-Za-z0-9_-]+):(?:\s|$)/gm)) {
    targets.add(match[1]);
  }

  return targets;
}

function validateJustReferences(templatePath) {
  const justTargets = parseJustTargets(path.posix.join(templatePath, "justfile"));
  const docsToScan = [
    path.posix.join(templatePath, "README.md"),
    path.posix.join(templatePath, "docs/RELIABILITY.md"),
  ];

  for (const relativePath of docsToScan) {
    const contents = readText(relativePath);
    for (const match of contents.matchAll(/\bjust ([A-Za-z0-9_-]+)/g)) {
      const justTarget = match[1];
      if (!justTargets.has(justTarget)) {
        report(`${relativePath}: references missing just target ${justTarget}`);
      }
    }
  }
}

function validateRegistryMetadata(templateEntry) {
  const templatePath = templateEntry.path;
  const readme = readText(path.posix.join(templatePath, "README.md"));
  const miseToml = readText(path.posix.join(templatePath, "mise.toml"));
  const metadata = templateEntry.metadata ?? {};
  const stacks = new Set(metadata.stack ?? []);
  const runtimes = new Set(metadata.runtime ?? []);
  const lanes = new Set(metadata.lane ?? []);

  for (const [stackName, pattern] of Object.entries(STACK_KEYWORDS)) {
    const hasKeyword = pattern.test(readme);
    if (stacks.has(stackName) && !hasKeyword) {
      report(`${templatePath}: registry stack ${stackName} is not reflected in README.md`);
    }
    if (!stacks.has(stackName) && stackName !== "nextjs" && hasKeyword) {
      report(`${templatePath}: README.md mentions ${stackName} but registry metadata does not`);
    }
  }

  for (const runtimeName of runtimes) {
    const requiredTools = RUNTIME_TOOLS[runtimeName] ?? [];
    for (const toolName of requiredTools) {
      if (!new RegExp(`^${toolName}\\s*=`, "m").test(miseToml)) {
        report(`${templatePath}: runtime ${runtimeName} is missing tool ${toolName} in mise.toml`);
      }
    }
  }

  const hasPythonApi = exists(path.posix.join(templatePath, "apps/api/package.json"));
  const hasRustApi = exists(path.posix.join(templatePath, "apps/axum/Cargo.toml"));

  if (lanes.has("web") && (hasPythonApi || hasRustApi)) {
    report(`${templatePath}: lane metadata says web-only, but backend app files exist`);
  }

  if (lanes.has("full-stack") && !hasPythonApi && !hasRustApi) {
    report(`${templatePath}: lane metadata says full-stack, but no backend app was found`);
  }

  if (runtimes.has("python") && !hasPythonApi) {
    report(`${templatePath}: runtime metadata expects Python, but apps/api is missing`);
  }

  if (runtimes.has("rust") && !hasRustApi) {
    report(`${templatePath}: runtime metadata expects Rust, but apps/axum is missing`);
  }
}

function main() {
  validateRequiredFiles(ROOT_REQUIRED_FILES, "root repo");

  const registry = JSON.parse(readText("templates/registry.json"));
  for (const templateEntry of registry.templates) {
    const requiredFiles = TEMPLATE_REQUIRED_FILES.map((relativePath) =>
      path.posix.join(templateEntry.path, relativePath),
    );
    validateRequiredFiles(requiredFiles, templateEntry.name);
    validateJustReferences(templateEntry.path);
    validateRegistryMetadata(templateEntry);
  }

  for (const relativePath of collectMarkdownFiles()) {
    validateMarkdownLinks(relativePath);
  }

  if (errors.length > 0) {
    console.error("docs:check failed");
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("docs:check passed");
}

main();
