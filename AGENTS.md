# Project Context

This repository is a template catalog plus a small scaffold CLI. Start with:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/README.md](docs/README.md)
- [templates/registry.json](templates/registry.json)

## Working Rules

- Treat `templates/` and `templates/registry.json` as the source of truth for scaffolds.
- Keep root docs concise, agent-readable, and aligned with the actual workflow files.
- Prefer local repo commands and file links over paraphrased instructions.
- When changing a template, remember that the release pack and CI both validate the copied template contents.
- Do not rewrite generated output unless the template or source asset changed first.

## What Matters Most

- Repo structure and ownership boundaries live in `ARCHITECTURE.md`.
- Release packaging and npm publication flow live in `docs/RELEASE.md`.
- CI and workflow coverage live in `docs/CI.md`.
- Planning, reliability, and quality expectations live in `docs/EXPECTATIONS.md`.
