# Reliability

## Local Commands

Run from the repository root:

```bash
just install
pnpm dev
just lint
just typecheck
just test
just ux
just supply-chain
just ci
```

Run the API directly when needed:

```bash
pnpm --filter api dev
```

## Lane Responsibilities

- `just lint`: web lint, shared UI layer checks, Ruff, deptry, and import-linter
- `just typecheck`: Next.js typecheck plus `basedpyright`
- `just test`: Vitest plus `pytest`
- `just ux`: Playwright, axe, and Lighthouse for the web app
- `just supply-chain`: gitleaks, osv-scanner, `pnpm audit`, and `pip-audit`

## CI

GitHub Actions runs the build and test lanes defined in `.github/workflows/ci.yml`.

## Doc Gardening

Doc gardening is a repeated manual task tracked in `docs/exec-plans/repeated-work.md`.
