# Next.js Monorepo Template

This template ships a README-aligned harness for `apps/web`.

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

- `just lint`: Biome, dependency-cruiser, and knip for `apps/web`
- `just typecheck`: `tsc --noEmit` for `apps/web`
- `just test`: Vitest smoke coverage for `apps/web`
- `just ux`: Playwright, axe, and Lighthouse against the running Next.js app
- `just supply-chain`: gitleaks, osv-scanner, and `pnpm audit`

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
