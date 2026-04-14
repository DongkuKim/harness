# Next.js + Axum Monorepo Template

This template ships a README-aligned harness for `apps/web` and `apps/axum`.

The template root `.mise.toml` is the source of truth for the local toolchain; run `mise install` before `just install` if you are not already inside a mise-managed shell.

## Harness Commands

Run all top-level checks from the template root:

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

- `just lint`: Biome, dependency-cruiser, and knip for `apps/web`; dependency-cruiser layer checks for `packages/ui`; a custom Rust layer boundary check plus rustfmt, clippy, and cargo-udeps for `apps/axum`
- `just typecheck`: `tsc --noEmit` for `apps/web` and `cargo check` for `apps/axum`
- `just test`: Vitest smoke coverage for `apps/web` and cargo-nextest coverage for `apps/axum`
- `just ux`: Playwright, axe, and Lighthouse against the running Next.js app
- `just supply-chain`: gitleaks, osv-scanner, `pnpm audit`, `cargo deny`, and `cargo audit`

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
