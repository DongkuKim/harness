# Architecture

## Repository Shape

- `bin/dk-harness`: Python CLI entrypoint for listing modules and composing scaffolds.
- `bin/dk_harness_compose.py`: module loader, validation layer, and deterministic scaffold composer.
- `templates/modules/`: source-of-truth module catalog. Each module owns its manifest plus emitted files and fragments.
- `scaffolds/presets/`: curated internal compositions used for CI, fixture freshness, and release verification.
- `scaffolds/generated/`: committed scaffold fixtures generated from the preset manifests.
- `scripts/validate-modules.mjs`: manifest validation for the module catalog.
- `scripts/generate-scaffolds.mjs`: fixture freshness check and sync command for `scaffolds/generated/`.
- `scripts/release-pack-check.mjs`: release gate that validates the packed npm package and composes every curated preset from the packaged CLI.
- `.github/workflows/templates-ci.yml`: CI for committed generated scaffold fixtures.
- `docs/`: root knowledge base for agents and maintainers.

## Change Flow

- User-facing scaffold changes usually start in `templates/modules/`.
- Curated fixture changes start in `scaffolds/presets/`.
- `npm run fixtures:sync` regenerates `scaffolds/generated/` from the module catalog plus preset manifests.
- `package.json` publishes the CLI and module catalog in the npm tarball. Committed generated fixtures stay in the repo and are not shipped.
- Release checks are designed to catch missing package files, broken composition logic, stale fixtures, or tarballs that drift from the supported module model.

## Module Catalog

- `core-monorepo`: required foundation module that owns the root workspace, shared packages, docs, and base harness wiring.
- `frontend-nextjs`: optional Next.js app module that emits `apps/web`.
- `backend-fastapi`: repeatable FastAPI runtime module that emits `apps/<id>`.
- `backend-axum`: repeatable Axum runtime module that emits `apps/<id>`.

The module catalog is intentionally coarse-grained in v1. Add smaller modules only when composition pressure makes the extra split worth the maintenance cost.

## Preset Fixtures

- Preset manifests in `scaffolds/presets/` describe high-value supported compositions such as web-only, web plus FastAPI, web plus Axum, mixed-runtime, and repeated-backend stacks.
- Generated fixtures in `scaffolds/generated/` are reviewable outputs used by docs checks, fixture CI, and freshness validation.
- Presets are internal verification assets. The public CLI exposes modules, not preset names.

## Workflow Topology

- Root repo CI validates the CLI, module catalog, docs, packaging, and supply-chain checks.
- Fixture CI runs `lint`, `typecheck`, `test`, `ux`, and `supply-chain` against the committed generated scaffolds.
- Scaffold evaluation packs the npm artifact, composes each curated preset with the packaged CLI, installs its dependencies, and runs generated repo checks.
- Release validation is separate from fixture CI and focuses on tarball shape plus packaged CLI composition.

## Ownership Boundaries

- Keep module-specific conventions inside the matching module directory.
- Keep curated composition definitions in `scaffolds/presets/`.
- Treat `scaffolds/generated/` as generated review artifacts, not hand-authored sources.
- Keep repo-level automation in `bin/`, `scripts/`, `package.json`, and `.github/workflows/`.
- Keep agent guidance in `AGENTS.md` and supporting docs under `docs/`.
