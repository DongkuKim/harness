# Frontend

## Scope

Frontend work lives in `apps/web` and `packages/ui`.
Backend work lives separately in `apps/api`.

## Shared UI Package

Use these public paths from `@workspace/ui`:

- `@workspace/ui/ui/*`
- `@workspace/ui/runtime/*`
- `@workspace/ui/providers/*`

Keep shared UI work aligned with the enforced stack and do not reintroduce the old `components/hooks/lib` package layers.

## Component Workflow

Add shared primitives with:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Generated shared components should land in `packages/ui/src/ui`.
