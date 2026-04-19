import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ROOT_REQUIRED_FILES = [
  "README.md",
  "AGENTS.md",
  "ARCHITECTURE.md",
  "docs/README.md",
  "docs/RELIABILITY.md",
  "docs/PLANS.md",
  "docs/QUALITY_SCORE.md",
  "docs/SECURITY.md",
];

const GENERATED_SCAFFOLD_REQUIRED_FILES = [
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
      if (childRelativePath.includes("/references") || entry.name === "node_modules") {
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
    ...walkMarkdown("scaffolds/generated"),
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

function main() {
  validateRequiredFiles(ROOT_REQUIRED_FILES, "root repo");

  const generatedRoot = path.join(repoRoot, "scaffolds", "generated");
  for (const entry of readdirSync(generatedRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const scaffoldPath = path.posix.join("scaffolds/generated", entry.name);
    const requiredFiles = GENERATED_SCAFFOLD_REQUIRED_FILES.map((relativePath) =>
      path.posix.join(scaffoldPath, relativePath),
    );
    validateRequiredFiles(requiredFiles, entry.name);
    validateJustReferences(scaffoldPath);
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
