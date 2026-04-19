# Next.js + FastAPI + Axum Monorepo Scaffold

This scaffold ships a README-aligned harness for `apps/web`, `apps/api`, `apps/realtime`.

The scaffold root `mise.toml` is the source of truth for the local toolchain; run `mise install` before `just install` if you are not already inside a mise-managed shell.

## Harness Commands

Run all top-level checks from the scaffold root:

```bash
just install
just lint
just typecheck
just test
just ux
just supply-chain
just ci
```

`packages/ui` is still generated and updated through `shadcn` commands, but its internal layer boundaries are checked as part of the harness.

## What Each Lane Covers

- `just lint`: Biome, dependency-cruiser, and knip for `apps/web`; dependency-cruiser layer checks for `packages/ui`; Ruff, deptry, and import-linter for `apps/api`; a custom Rust layer boundary check plus rustfmt, clippy, and cargo-udeps for `apps/realtime`
- `just typecheck`: `tsc --noEmit` for `apps/web`; `basedpyright` for `apps/api`; `cargo check` for `apps/realtime`
- `just test`: Vitest smoke coverage for `apps/web`; `pytest` coverage for `apps/api`; `cargo nextest` coverage for `apps/realtime`
- `just ux`: Playwright, axe, and Lighthouse against the running Next.js app
- `just supply-chain`: gitleaks, osv-scanner, and `pnpm audit`; `pip-audit` for `apps/api`; `cargo deny` and `cargo audit` for `apps/realtime`

## Apps

- `apps/web`: Next.js app
- `apps/api`: FastAPI backend service
- `apps/realtime`: Axum backend service

## Adding Components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This places generated UI components in `packages/ui/src/ui`.

## Using Components

Import shared components from the `ui` package.

```tsx
import { Button } from "@workspace/ui/ui/button"
```

## Running The FastAPI Backends

Start `apps/api` from the monorepo root:

```bash
pnpm --filter api dev
```

Or run it directly from the Python app:

```bash
cd apps/api
uv run fastapi dev app/main.py
```


## Running The Axum Backends

```bash
cd apps/realtime
cargo run
```
