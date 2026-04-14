# Architecture

## Repository Shape

- `apps/web`: the main Next.js application
- `packages/ui`: the shared UI package used by the app
- `packages/eslint-config`: shared lint config
- `packages/typescript-config`: shared TypeScript config

## Web App Layers

`apps/web` uses `dependency-cruiser` to enforce a small app-level stack:

- `app`
- `components`
- `hooks`
- `lib`

The important constraints are:

- `components` must not import `app`
- `hooks` may only import `lib`
- `lib` stays leaf-like

The rules live in `apps/web/dependency-cruiser.cjs` and run through `just lint`.

## Shared UI Domain Stack

`packages/ui` follows the business-domain stack:

- `Types`
- `Config`
- `Repo`
- `Service`
- `Runtime`
- `UI`

In filesystem terms that is:

- `src/types`
- `src/config`
- `src/repo`
- `src/service`
- `src/runtime`
- `src/ui`

Imports must only move forward through that chain.

## Explicit Cross-Cutting Boundary

Cross-cutting concerns do not enter the stack directly.
They enter through:

- `src/providers`

Provider-only helper code lives in:

- `src/utils`

`src/providers` may support `src/service` and `src/ui`.
`src/utils` is reserved for provider support and must not depend on domain code.

The rules live in `packages/ui/dependency-cruiser.cjs` and run through `just lint`.

## No Backend By Default

This template does not include a separate API server or database by default.
