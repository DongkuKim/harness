# Reliability

## Local Commands

Run from the repository root. The committed `mise.toml` pins the local toolchain, so `mise install` should come first on a fresh machine:

```bash
mise install
just install
just lint
just typecheck
just test
just ux
just supply-chain
just ci
```

Build package artifacts before publishing:

```bash
pnpm --filter @workspace/ui-kit build
```

Build package Storybook docs before sharing component previews:

```bash
pnpm --filter @workspace/ui-kit storybook:build
```

## Lane Responsibilities

- `just lint`: Biome, dependency-cruiser, and knip for `packages/ui-kit`
- `just typecheck`: `tsc --noEmit` for `packages/ui-kit`
- `just test`: Vitest component coverage for `packages/ui-kit`
- `just ux`: no-op when no UX-capable modules are selected
- `just supply-chain`: gitleaks, osv-scanner, and `pnpm audit`

## CI

GitHub Actions uses the generated lanes defined in `.github/workflows/ci.yml`.

## Doc Gardening

Doc gardening is a repeated manual task tracked in `docs/exec-plans/repeated-work.md`.
