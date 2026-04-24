# Next.js UI Kit Package Scaffold

This scaffold ships a README-aligned harness for publishable packages at `packages/ui-kit`.

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

Publishable package modules include their own `components.json` and package-level `shadcn` workflow.

## What Each Lane Covers

- `just lint`: Biome, dependency-cruiser, and knip for `packages/ui-kit`
- `just typecheck`: `tsc --noEmit` for `packages/ui-kit`
- `just test`: Vitest component coverage for `packages/ui-kit`
- `just ux`: no-op when no UX-capable modules are selected
- `just supply-chain`: gitleaks, osv-scanner, and `pnpm audit`

## Packages

- `packages/ui-kit`: Publishable Next.js UI kit package

## UI Kit Package Workflow

Add UI kit primitives with:

```bash
pnpm dlx shadcn@latest add button -c packages/ui-kit
```

Build a package before publishing:

```bash
pnpm --filter @workspace/ui-kit build
```

Review components in Storybook:

```bash
pnpm --filter @workspace/ui-kit storybook
```
