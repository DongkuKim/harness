# Ui Kit

Publishable Next.js-focused UI kit package.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm storybook
pnpm storybook:build
```

## Usage

Import the package stylesheet once from your Next.js app root:

```tsx
import "@workspace/ui-kit/globals.css"
```

Use package exports in app or shared UI code:

```tsx
import { Button } from "@workspace/ui-kit"
```

## Storybook

Run local component review:

```bash
pnpm storybook
```

Build static Storybook docs:

```bash
pnpm storybook:build
```

## Publishing

Change the package name in `package.json` to your registry scope before the first publish, then run:

```bash
pnpm prepublishOnly
pnpm publish --access public
```
