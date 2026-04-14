# CI

This repo now separates source-repo automation, template automation, and docs integrity checks.

- `.github/workflows/repo-ci.yml`: validates the `dk-harness` source repo itself
- `.github/workflows/templates-ci.yml`: validates the catalog per template
- `.github/workflows/docs-ci.yml`: validates required docs, relative markdown links, and documented `just` commands

## Source Repo Workflow

- `.github/workflows/repo-ci.yml` validates the `dk-harness` source repo itself.
- `repo / self-check`: Python CLI compilation, local `dk-harness list`, and release tarball verification
- `repo / supply-chain`: gitleaks, osv-scanner, and root `npm audit`

## Template Workflow

- `.github/workflows/templates-ci.yml` validates the catalog per template.
- `fast`: lint and typecheck
- `test`: unit and integration coverage
- `ux`: Playwright-based UX checks

## Matrix Strategy

- Each template runs through the same lane structure.
- Pull requests and pushes run only the templates touched by the change set.
- Changes to shared scaffold or workflow files fall back to the full template matrix.
- `workflow_dispatch` always runs the full matrix.
- Python and Rust toolchains are added only when a template needs them.
- Rust-specific templates may install extra tools such as `cargo-nextest` or `cargo-udeps`.

## Operational Notes

- The root repo command surface is `just self-check` and `just supply-chain`.
- CI should stay aligned with local commands in the root repo and in each template.
- When a template adds a new required tool, update the template's own harness and the workflow matrix together.
- When a repo-level change should invalidate every template, add its path to the shared-file filter in `.github/workflows/templates-ci.yml`.
- Template CI catches catalog drift. Repo CI catches source-repo release and supply-chain regressions.
- Run `npm run docs:check` locally when changing docs, template commands, or registry metadata.
- The docs workflow is meant to catch structure and drift, not to replace judgment about what the docs should say.
