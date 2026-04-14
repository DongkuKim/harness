# Reliability

## Local Commands

Run from the repository root. The committed `.mise.toml` pins the local toolchain, so `mise install` should come first on a fresh machine:

```bash
mise install
just install
pnpm dev
just lint
just typecheck
just test
just ux
just supply-chain
just ci
```

## Lane Responsibilities

- `just lint`: app lint plus shared UI dependency-layer checks
- `just typecheck`: TypeScript validation for `apps/web`
- `just test`: Vitest coverage for `apps/web`
- `just ux`: Playwright, axe, and Lighthouse for the running app
- `just supply-chain`: gitleaks, osv-scanner, and `pnpm audit`

## CI

GitHub Actions uses four jobs in `.github/workflows/ci.yml`:

- `fast`
- `test`
- `ux`
- `supply-chain`

## Doc Gardening

Doc gardening is a repeated manual task tracked in `docs/exec-plans/repeated-work.md`.
