# Reliability

## Local Commands

Run from the repository root unless noted otherwise. The committed `mise.toml` pins the local toolchain, so `mise install` should come first on a fresh machine:

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

Run the Rust service directly when needed:

```bash
cd apps/axum
cargo run
```

## Lane Responsibilities

- `just lint`: web lint, shared UI layer checks, Rust layer check, `cargo fmt`, `clippy`, and `cargo udeps`
- `just typecheck`: Next.js typecheck plus `cargo check --all-targets`
- `just test`: Vitest plus `cargo nextest run`
- `just ux`: Playwright, axe, and Lighthouse for the web app
- `just supply-chain`: gitleaks, osv-scanner, `pnpm audit`, `cargo deny`, and `cargo audit`

## CI

GitHub Actions runs the build and test lanes defined in `.github/workflows/ci.yml`.

## Doc Gardening

Doc gardening is a repeated manual task tracked in `docs/exec-plans/repeated-work.md`.
