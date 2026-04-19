# dk-harness

Harness for agentic development.

This harness was created following OpenAI's Harness Engineering article:
https://openai.com/ko-KR/index/harness-engineering/

For the root repo map and operating docs, start with:

- [AGENTS.md](AGENTS.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/README.md](docs/README.md)

The goal is not only to test correctness, but to create an environment where an AI agent is pushed toward good behavior by default:

- fast feedback
- deterministic tooling
- hard architectural boundaries
- tests for real user behavior
- checks that catch dependency, security, and maintenance anti-patterns early

This repo should optimize for three stacks only:

- `Next.js`
- `Python`
- `Rust`

## Principles

- Prefer tools that are fast enough to run locally on every change.
- Enforce boundaries automatically instead of relying on code review.
- Test user-visible behavior, not just implementation details.
- Keep CI layered: fast checks first, slower UX checks after.
- Make the same commands work locally and in CI.

## Shared Foundation

These are worth using no matter which stack a project uses.

| Role | Recommended tools | Why |
| --- | --- | --- |
| Toolchain pinning | `mise` | Commit the repo toolchain in `.mise.toml` and each generated scaffold toolchain in `mise.toml` so agents and humans run the same versions. |
| Task runner | `just` | Gives the agent a small, predictable command surface such as `just lint` and `just test`. |
| Git hooks | `lefthook` or `pre-commit` | Run fast checks before bad changes spread. |
| CI | `GitHub Actions` | Standardize the same harness in automation. |
| Dependency updates | `Renovate` | Keeps dependencies current without relying on memory. |
| Secrets scanning | `gitleaks` | Prevents obvious security mistakes from landing. |
| Repo-wide vuln scanning | `osv-scanner` | One simple cross-ecosystem supply-chain check. |

## Bootstrap

Run `mise install` at the repository root before using the CLI or any release checks. The committed [`.mise.toml`](.mise.toml) is the source of truth for the repo's pinned Node, pnpm, and Python versions.

## Source Repo Commands

Use the root repo commands when you are validating `dk-harness` itself rather than one of the generated templates.

```bash
just self-check
just supply-chain
just ci
```

## By Role

These are the categories the harness should cover across all stacks.

| Role | What to enforce |
| --- | --- |
| Formatter / linter | Style, common mistakes, import hygiene, obvious bad patterns |
| Type / static analysis | Type soundness, invalid assumptions, weak interfaces |
| Dependency detection | Unused deps, missing deps, forbidden imports, circular dependencies |
| Architecture boundaries | Rules like `ui -> app -> domain -> infra`, never the reverse |
| Unit / integration tests | Behavioral correctness at module and service level |
| End-to-end tests | Real user flows, cross-boundary regressions |
| Accessibility / UX checks | Keyboard nav, labels, contrast, layout breakage, performance regressions |
| Security / supply chain | Vulnerabilities, licenses, secrets, dependency policy |
| Reproducibility | Same commands, same versions, same fixtures locally and in CI |

## Next.js

`Next.js` is where most user-experience anti-patterns show up, so this stack needs the strongest UX harness.

| Role | Recommended tools | Notes |
| --- | --- | --- |
| Formatter / linter | `biome` | Good fast default for formatting and linting. |
| Type checking | `tsc --noEmit` | Must run in CI even if the app builds. |
| Dependency boundaries | `dependency-cruiser` | Enforce layer rules and catch circular imports. |
| Unused files / exports / deps | `knip` | Very useful for agent-generated dead code. |
| Unit / component tests | `vitest` + `@testing-library/react` | Fast feedback for UI logic and state transitions. |
| API / network mocking | `msw` | Keeps tests deterministic and avoids flaky network coupling. |
| Browser E2E | `playwright` | Test real flows, routing, auth, forms, and edge states. |
| Accessibility | `@axe-core/playwright` | Catch common a11y regressions inside E2E tests. |
| Visual regression | `playwright` screenshot assertions or `Chromatic` | Useful for catching broken layouts and style drift. |
| Performance / UX budgets | `Lighthouse CI` | Catch slow pages, layout shift, and basic UX regressions. |
| Component review | `Storybook` | Helpful when you want isolated state coverage and reviewable UI fixtures. |

Recommended baseline for `Next.js`:

- `biome`
- `tsc --noEmit`
- `dependency-cruiser`
- `knip`
- `vitest`
- `playwright`
- `@axe-core/playwright`
- `Lighthouse CI`

## Python

Use Python for automation, agents, orchestration, APIs, and evaluation tools. The harness should favor speed and strictness.

| Role | Recommended tools | Notes |
| --- | --- | --- |
| Package / env management | `uv` | Fast and reproducible Python environment management. |
| Formatter / linter | `ruff` | Replaces several slower tools with one fast tool. |
| Type checking | `basedpyright` or `pyright` | Strong static analysis for agent-written Python. |
| Dependency detection | `deptry` | Finds undeclared and unused dependencies. |
| Architecture boundaries | `import-linter` | Enforce import contracts between layers or packages. |
| Unit / integration tests | `pytest` | The default testing backbone. |
| Parallel test execution | `pytest-xdist` | Speeds up larger test suites. |
| Property-based tests | `hypothesis` | Very good for catching edge cases agents often miss. |
| Security scanning | `pip-audit` | Checks installed Python dependencies for known vulns. |
| Security linting | `bandit` | Optional, but helpful for scripts that touch files, shells, or secrets. |

Recommended baseline for `Python`:

- `uv`
- `ruff`
- `basedpyright`
- `deptry`
- `import-linter`
- `pytest`
- `hypothesis`
- `pip-audit`

## Rust

Use Rust when correctness, performance, and strong interfaces matter. The harness should lean into strict compiler- and lint-driven workflows.

| Role | Recommended tools | Notes |
| --- | --- | --- |
| Formatter | `rustfmt` | Keep formatting non-negotiable. |
| Linting | `clippy` | Strong default lint layer for correctness and idioms. |
| Test runner | `cargo nextest` | Faster and better-scaled test execution than plain `cargo test`. |
| Built-in tests | `cargo test` | Still the standard compatibility baseline. |
| Unused dependency detection | `cargo-udeps` | Excellent at finding leftover crate deps. |
| Dependency / license policy | `cargo-deny` | Good for security, sources, and license enforcement. |
| Vulnerability scanning | `cargo-audit` | Checks crates against known advisories. |
| Property-based tests | `proptest` | Useful for parser, protocol, and state-machine logic. |
| Fuzzing | `cargo-fuzz` | Worth using for parsers, protocol handlers, and unsafe boundaries. |
| Benchmarks | `criterion` | Helpful when performance regressions matter. |

Recommended baseline for `Rust`:

- `rustfmt`
- `clippy`
- `cargo nextest`
- `cargo-udeps`
- `cargo-deny`
- `cargo-audit`
- `proptest`

## Suggested CI Lanes

Do not run everything in one giant job. Split the harness by speed and purpose.

1. `fast`: formatting, linting, type checks, dependency checks, architecture checks
2. `test`: unit and integration tests
3. `ux`: Playwright, accessibility, visual regression, Lighthouse
4. `supply-chain`: vulnerability, license, and secret scanning

For this source repo specifically, the lane split is:

- `self-check`: CLI compilation plus release tarball verification
- `supply-chain`: gitleaks, osv-scanner, and root `npm audit`

## Minimal Opinionated Starter Set

If I wanted a strong default harness for agentic development without making it too heavy, I would start with:

- Shared: `mise`, `just`, `GitHub Actions`, `Renovate`, `gitleaks`, `osv-scanner`
- `Next.js`: `biome`, `tsc --noEmit`, `dependency-cruiser`, `knip`, `vitest`, `playwright`, `@axe-core/playwright`, `Lighthouse CI`
- `Python`: `uv`, `ruff`, `basedpyright`, `deptry`, `import-linter`, `pytest`, `hypothesis`, `pip-audit`
- `Rust`: `rustfmt`, `clippy`, `cargo nextest`, `cargo-udeps`, `cargo-deny`, `cargo-audit`, `proptest`

## What This Harness Should Catch

The important thing is not just having tools, but making them block the kinds of failures agents are prone to produce:

- dead code and unused dependencies
- circular imports and broken architecture boundaries
- passing builds with broken types
- brittle tests that mock too much and verify too little
- inaccessible UI and broken keyboard flows
- layout regressions that still look fine in code review
- slow pages and poor Core Web Vitals
- dependency vulnerabilities and leaked secrets
- environment drift between local runs and CI

## Modules And Presets

This repo now acts as a module catalog plus a curated preset-fixture set.

- [`templates/modules/`](templates/modules): source-of-truth scaffold modules
- [`scaffolds/presets/`](scaffolds/presets): internal preset manifests used for CI and release verification
- [`scaffolds/generated/`](scaffolds/generated): committed outputs generated from those preset manifests

The public CLI exposes modules, not preset names. In v1, `core-monorepo` is required, `frontend-nextjs` is optional and fixed to `apps/web`, and backend runtimes are repeatable with explicit app ids.

## CLI

Use [bin/dk-harness](bin/dk-harness) to compose scaffolds from the local module catalog:

```bash
./bin/dk-harness list
./bin/dk-harness new my-app \
  --module core-monorepo \
  --module frontend-nextjs
./bin/dk-harness new my-stack \
  --module core-monorepo \
  --module frontend-nextjs \
  --module backend-fastapi:api \
  --module backend-axum:realtime \
  --init-git
```

The CLI composes directly from `templates/modules/`, so edits made there immediately affect future scaffolds from this repo.

You can also expose the same CLI through npm because the repo now defines a package binary in [package.json](package.json).

Local repo usage with npm:

```bash
npm exec --package . -- dk-harness list
npm exec --package . -- dk-harness new my-app --module core-monorepo --module frontend-nextjs
```

If you publish the package to npm, consumers can run it without cloning the repo:

```bash
npx dk-harness@latest list
npx dk-harness@latest new my-app --module core-monorepo --module frontend-nextjs
```

The current CLI is a Python entrypoint, so machines using the npm binary still need `python3` available.

## npm Publishing

The package should publish as `dk-harness`.

- It keeps the npm package name aligned with the installed binary name.
- It matches the intended `npm exec` and `npx` workflows from issue `#3`.
- We can add a separate `create-dk-harness` package later if we want an opinionated `npm create` onboarding flow.

Release prerequisites:

- Run `mise install` first if you want the committed toolchain versions instead of relying on system binaries.
- `python3` must be on `PATH` if you are not using `mise`, because the published binary is a Python script.
- Node.js and npm must be available to run `npm exec`, `npx`, `npm pack`, and `npm publish`.
- gitleaks and osv-scanner must be available if you want to run `just supply-chain` locally.

Release gate:

```bash
npm run release:check
```

That command verifies all of the following against the packed tarball, not the working tree:

- `bin/dk-harness`, the module catalog under `templates/modules/`, `README.md`, and `LICENSE` are included
- committed generated fixtures under `scaffolds/generated/` are not included
- the packaged CLI can run `dk-harness list`
- composing every curated preset from the packaged CLI copies `.github/workflows/ci.yml`

Suggested publish flow:

```bash
npm version <patch|minor|major>
npm run release:check
npm publish
npm exec --yes --package dk-harness -- dk-harness list
npx dk-harness@latest list
```

Manual GitHub Actions publish path:

- Configure the repository `NPM_TOKEN` secret.
- Run `.github/workflows/npm-publish.yml` in dry-run mode first.
- Re-run the same workflow with `dry_run: false` when the release tag is ready to publish.

## Skills In Generated Scaffolds

Skill-related project files follow the generated scaffold if they are committed into the source modules.

- Keep project-level files such as `skills-lock.json` if you want every generated project to inherit them.
- Leave out machine-local folders such as `.agents/`, `.claude/`, `node_modules/`, and build output.

## Standalone Generated Repos

If you also want a composed scaffold to live as its own GitHub repo, export the same module set from this repo and push from there:

```bash
./bin/dk-harness export ../dk-harness-next-monorepo \
  --module core-monorepo \
  --module frontend-nextjs \
  --force
./bin/dk-harness export ../dk-harness-mixed-runtime \
  --module core-monorepo \
  --module frontend-nextjs \
  --module backend-fastapi:api \
  --module backend-axum:realtime \
  --force
```

That keeps `dk-harness` as the local source of truth while letting you publish generated downstream repos independently.
