# Frontend

## Scope

This scaffold is frontend-first.
Most product work will happen in `apps/web` and `packages/ui`.

## Shared UI Package

Use these public paths from `@workspace/ui`:

- `@workspace/ui/ui/*` for shared rendering components
- `@workspace/ui/runtime/*` for runtime helpers
- `@workspace/ui/providers/*` for explicit cross-cutting boundaries

Do not reintroduce `components`, `hooks`, or `lib` as top-level shared package layers.

## Component Workflow

Add shared primitives with:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Generated shared components should land in `packages/ui/src/ui`.

## App-Level Frontend Rules

- Keep app code aligned with the `app -> components -> hooks -> lib` constraints
- Prefer package imports over deep relative imports
- Re-run the affected lint and typecheck lanes before handoff
