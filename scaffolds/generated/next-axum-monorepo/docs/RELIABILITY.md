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

Run an Axum service directly when needed:

```bash
cd apps/axum
cargo run
```

## Lane Responsibilities

- `just lint`: Biome, dependency-cruiser, and knip for `apps/web`; dependency-cruiser layer checks for `packages/ui`; a custom Rust layer boundary check plus rustfmt, clippy, and cargo-udeps for `apps/axum`
- `just typecheck`: `tsc --noEmit` for `apps/web`; `cargo check` for `apps/axum`
- `just test`: Vitest smoke coverage for `apps/web`; `cargo nextest` coverage for `apps/axum`
- `just ux`: Playwright, axe, and Lighthouse against the running Next.js app
- `just supply-chain`: gitleaks, osv-scanner, and `pnpm audit`; `cargo deny` and `cargo audit` for `apps/axum`

## CI

GitHub Actions uses the generated lanes defined in `.github/workflows/ci.yml`.

## Doc Gardening

Doc gardening is a repeated manual task tracked in `docs/exec-plans/repeated-work.md`.
