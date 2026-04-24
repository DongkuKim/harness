# Reliability

This repo treats reliability as a small, explicit command surface that stays aligned across local runs, GitHub Actions, and the packed package artifact.

## Local Command Surface

Run from the repository root unless noted otherwise. The committed [`.mise.toml`](../.mise.toml) is the source of truth for the pinned Node, pnpm, and Python toolchain:

```bash
mise install
pnpm run modules:check
pnpm run fixtures:check
pnpm run docs:check
pnpm run release:check
just self-check
just supply-chain
just ci
```

- `pnpm run modules:check`: validates every `templates/modules/*/module.json` manifest and its declared emitted sources.
- `pnpm run fixtures:check`: composes every curated preset from `scaffolds/presets/`, compares the results with `scaffolds/generated/`, and runs a backend-only smoke composition.
- `pnpm run docs:check`: validates required docs, relative markdown links, and documented `just` targets across the root repo and committed generated fixtures.
- `pnpm run release:check`: packs the package tarball, verifies required shipped entries, ensures generated fixtures are not shipped, and composes every curated preset from the packed CLI.
- `just self-check`: runs `pnpm run repo:self-check` to compile the Python CLI, validate modules and fixture freshness, verify a direct local `dk-harness list`, and run the packed release smoke test.
- `just supply-chain`: runs `pnpm run repo:supply-chain` for gitleaks, osv-scanner, and the root `pnpm audit`.
- `just ci`: runs both root repo lanes.

Scaffold-level `just lint`, `just typecheck`, `just test`, and `just ux` commands live inside the committed generated fixtures and are validated by fixture CI and scaffold evaluation.

## Workflow Coverage

- [`.github/workflows/repo-ci.yml`](../.github/workflows/repo-ci.yml): root repo `self-check` and `supply-chain` lanes
- [`.github/workflows/templates-ci.yml`](../.github/workflows/templates-ci.yml): validates the committed generated scaffold fixtures in place
- [`.github/workflows/docs-ci.yml`](../.github/workflows/docs-ci.yml): runs docs integrity checks for the root repo and committed generated fixture markdown
- [`.github/workflows/scaffold-eval.yml`](../.github/workflows/scaffold-eval.yml): composes each curated preset from the packaged CLI and runs the generated repo checks
- [`.github/workflows/package-publish.yml`](../.github/workflows/package-publish.yml): manual publish path that reruns the root self-check before `pnpm publish`

## Fixture CI Shape

- `fast`: runs `just lint` and `just typecheck`
- `test`: runs `just test`
- `ux`: installs Playwright browser dependencies and runs `just ux`
- `supply-chain`: runs `just supply-chain`
- Python and Rust setup are lane- and preset-specific, so workflow matrix metadata and generated scaffold commands need to move together when runtime requirements change
- [`.github/workflows/templates-ci.yml`](../.github/workflows/templates-ci.yml) and [`.github/workflows/scaffold-eval.yml`](../.github/workflows/scaffold-eval.yml) derive their fixture and preset matrices through [`scripts/scaffold-ci-matrix.mjs`](../scripts/scaffold-ci-matrix.mjs)
- On pull requests, Axum/Rust-backed matrix entries are skipped unless Axum module, Axum preset, or generated Axum fixture inputs changed; pushes to `main` and manual runs keep full coverage

## Release And Scaffold Verification

- [`scripts/release-pack-check.mjs`](../scripts/release-pack-check.mjs) is the release gate behind `pnpm run release:check`
- the tarball must include the CLI, `README.md`, `LICENSE`, and the module catalog under `templates/modules/`
- the tarball must not include committed generated fixtures from `scaffolds/generated/`
- the release gate smoke-tests `dk-harness list` from the packed tarball and composes every curated preset into a temporary directory
- [`.github/workflows/scaffold-eval.yml`](../.github/workflows/scaffold-eval.yml) complements the tarball check by running the generated repos' own `just lint`, `just typecheck`, and `just test` commands
- [`.github/workflows/package-publish.yml`](../.github/workflows/package-publish.yml) is intentionally manual; use the default dry run first, then rerun with `dry_run: false` when ready to publish

## Operating Expectations

- Favor fast, deterministic checks that can run locally and in CI.
- Keep repo commands, workflow lanes, and release checks aligned with what an agent would actually run.
- When a module adds a required runtime or tool, update the module manifest, curated presets, fixture CI metadata, and scaffold evaluation together.
- When a repo-level change should invalidate every composed scaffold, update the shared-path filters in [`.github/workflows/templates-ci.yml`](../.github/workflows/templates-ci.yml).
- Treat broken composition, tarball drift, stale fixtures, and docs drift as product regressions, not cleanup.
