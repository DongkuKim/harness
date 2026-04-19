# Reliability

## Local Commands

Run from the repository root. The committed `mise.toml` pins the local toolchain, so `mise install` should come first on a fresh machine:

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

Run a FastAPI app directly when needed:

```bash
pnpm --filter api dev
```

Run an Axum service directly when needed:

```bash
cd apps/realtime
cargo run
```

## Lane Responsibilities

- `just lint`: Biome, dependency-cruiser, and knip for `apps/web`; dependency-cruiser layer checks for `packages/ui`; Ruff, deptry, and import-linter for `apps/api`; a custom Rust layer boundary check plus rustfmt, clippy, and cargo-udeps for `apps/realtime`
- `just typecheck`: `tsc --noEmit` for `apps/web`; `basedpyright` for `apps/api`; `cargo check` for `apps/realtime`
- `just test`: Vitest smoke coverage for `apps/web`; `pytest` coverage for `apps/api`; `cargo nextest` coverage for `apps/realtime`
- `just ux`: Playwright, axe, and Lighthouse against the running Next.js app
- `just supply-chain`: gitleaks, osv-scanner, and `pnpm audit`; `pip-audit` for `apps/api`; `cargo deny` and `cargo audit` for `apps/realtime`

## CI

GitHub Actions uses the generated lanes defined in `.github/workflows/ci.yml`.

## Doc Gardening

Doc gardening is a repeated manual task tracked in `docs/exec-plans/repeated-work.md`.
