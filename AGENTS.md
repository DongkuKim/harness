# Project Context

This repository is a module catalog plus a small scaffold CLI. Start with:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/README.md](docs/README.md)
- [templates/modules/core-monorepo/module.json](templates/modules/core-monorepo/module.json)

## Working Rules

- Treat `templates/modules/` as the source of truth for scaffold sources.
- Treat `scaffolds/presets/` as the source of truth for curated fixture compositions.
- Keep root docs concise, agent-readable, and aligned with the actual workflow files.
- Prefer local repo commands and file links over paraphrased instructions.
- When changing a module, remember that the release pack and CI both validate composed scaffold outputs.
- Do not rewrite `scaffolds/generated/` unless the module or preset source changed first.

## What Matters Most

- Repo structure and ownership boundaries live in `ARCHITECTURE.md`.
- Root repo commands, CI and workflow coverage, and release and scaffold verification live in `docs/RELIABILITY.md`.
- Planning conventions and execution-plan storage live in `docs/PLANS.md`.
- Quality expectations for docs, catalog changes, and automation live in `docs/QUALITY_SCORE.md`.
