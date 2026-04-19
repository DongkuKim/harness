# New User Onboarding

## Goal

A new user should be able to discover the supported scaffold modules, compose the right stack with a single command, and trust that the generated repo matches the committed module catalog.

## Primary User

- an agent or developer who wants a supported harness without maintaining a full starter template per stack combination
- someone choosing between a web-only monorepo, a backend-only repo, or a mixed-runtime monorepo
- someone who wants the same composition flow to work from the local repo and from the published npm package

## Current Product Surface

The current product is a small module catalog plus a scaffold CLI:

- `dk-harness list` prints every supported module with its description, kind, runtime, repeatability, requirements, conflicts, and default app id when applicable
- `dk-harness new <destination> --module <spec>...` composes a new scaffold from repeated `--module` flags
- `dk-harness export <destination> --module <spec>...` copies the same composition flow into an existing target path for downstream sync use cases

The source of truth for what users can scaffold is [`templates/modules/`](../../templates/modules), and the CLI composes directly from those module definitions. Curated preset manifests in [`scaffolds/presets/`](../../scaffolds/presets) exist for CI and release verification, but they are not part of the public CLI.

## Happy Path

1. The user runs `dk-harness list` and sees the supported modules:
   - `core-monorepo`
   - `frontend-nextjs`
   - `backend-fastapi`
   - `backend-axum`
2. The user chooses a composition based on the stack they need:
   - web-only: `core-monorepo` + `frontend-nextjs`
   - web + API: add `backend-fastapi:api`
   - web + Rust service: add `backend-axum:realtime`
   - repeated services: add more repeatable runtime modules with unique ids
3. The user scaffolds a repo with one command:
   - local repo: `./bin/dk-harness new my-app --module core-monorepo --module frontend-nextjs`
   - npm package: `npm exec --package . -- dk-harness new my-app --module core-monorepo --module frontend-nextjs`
   - published package: `npx dk-harness@latest new my-app --module core-monorepo --module frontend-nextjs`
4. The CLI validates module requirements and conflicts, composes the scaffold into the destination, and optionally initializes git with `--init-git`.
5. The generated repo contains the committed harness files, its own workflow and `just` command surface, and the requested `apps/*` layout.

## Current Implementation Details

- Module selection is non-interactive. Users must pass repeated `--module` flags explicitly.
- `core-monorepo` must appear exactly once.
- `frontend-nextjs` is non-repeatable and always emits `apps/web`.
- `backend-fastapi` and `backend-axum` are repeatable and require unique runtime ids across `apps/*`.
- Missing requirements and declared conflicts fail before the CLI writes any files.
- The CLI refuses to write into a non-empty directory unless `--force` is provided.
- Copying ignores generated and machine-local directories such as `.git`, `node_modules`, `.next`, `.venv`, `dist`, and `target`.
- Unknown module names fail with an error that lists the known module names.
- Module manifests are validated before release and fixture checks run, including required fields and declared emitted sources.

## Trust And Verification

The onboarding experience is backed by repo-level checks rather than by narrative alone:

- `npm run repo:self-check` compiles the Python CLI, validates the module catalog, checks fixture freshness, runs `./bin/dk-harness list`, and then runs the release packaging verification
- `npm run fixtures:check` composes every curated preset into a temporary directory and fails if `scaffolds/generated/` drifted from the module sources
- `npm run release:check` packs the npm tarball, verifies required package contents, confirms committed fixtures are not shipped, runs the packaged CLI, and composes every curated preset
- `npm run scaffold:eval -- --preset <name>` composes a fresh repo from the packed tarball and runs the generated repo's own `just lint`, `just typecheck`, and `just test` commands

## Non-Goals In The Current Implementation

- no interactive module wizard
- no post-scaffold questionnaire or setup assistant
- no preset-name aliases in the public CLI
- no generic merge DSL for arbitrary root-file patching beyond the current typed builders
