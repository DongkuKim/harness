# Architecture

## Repository Shape

- `bin/dk-harness`: Python CLI entrypoint for listing, creating, and exporting templates.
- `templates/`: local template catalog copied into new projects.
- `templates/registry.json`: source of truth for template names, descriptions, and downstream repos.
- `scripts/release-pack-check.mjs`: release gate that validates the published npm package contents and CLI smoke flow.
- `.github/workflows/templates-ci.yml`: CI for template linting, type checking, testing, and UX checks.
- `docs/`: root knowledge base for agents and maintainers.

## Change Flow

- User-facing repo changes usually start in `templates/`.
- The CLI copies templates directly from this repo, so template edits affect future scaffolds immediately.
- `package.json` publishes the CLI wrapper and includes the template catalog in the npm tarball.
- Release checks are designed to catch missing package files, broken scaffolds, or a missing template workflow before publish.

## Template Catalog

- `next-monorepo`: Next.js monorepo starter with a shared UI package.
- `next-axum-monorepo`: Next.js + Axum starter with a Rust backend.
- `next-fastapi-monorepo`: Next.js + FastAPI starter with a Python backend.

The catalog is intentionally small. Add new templates only when they represent a real supported starter, not a one-off example.

## Workflow Topology

- CI is matrixed per template so each starter is validated in isolation.
- Fast checks run first, followed by tests, then UX checks.
- Release validation is separate from CI and focuses on the npm package shape plus a scaffold smoke test.

## Ownership Boundaries

- Keep template-specific conventions inside the matching template directory.
- Keep repo-level automation in `bin/`, `scripts/`, `package.json`, and `.github/workflows/`.
- Keep agent guidance in `AGENTS.md` and supporting docs under `docs/`.
