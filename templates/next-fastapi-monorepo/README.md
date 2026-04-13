# Next.js + FastAPI Monorepo Template

This template ships a README-aligned harness for `apps/web` and `apps/api`.

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

`packages/ui` is intentionally excluded from harness enforcement because it is generated and updated through `shadcn` commands.

## What Each Lane Covers

- `just lint`: Biome, dependency-cruiser, and knip for `apps/web`; Ruff, deptry, and import-linter for `apps/api`
- `just typecheck`: `tsc --noEmit` for `apps/web` and basedpyright for `apps/api`
- `just test`: Vitest smoke coverage for `apps/web` and pytest coverage for `apps/api`
- `just ux`: Playwright, axe, and Lighthouse against the running Next.js app
- `just supply-chain`: gitleaks, osv-scanner, `pnpm audit`, and `pip-audit`

## Apps

- `apps/web`: Next.js app
- `apps/api`: FastAPI app

## Adding Components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This places generated UI components in `packages/ui/src/components`.

## Using Components

Import shared components from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Running The Backend

Start the FastAPI app from the monorepo root:

```bash
pnpm --filter api dev
```

Or run it directly from the Python app:

```bash
cd apps/api
uv run fastapi dev app/main.py
```
