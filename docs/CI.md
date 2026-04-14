# CI

The GitHub workflow in `.github/workflows/templates-ci.yml` validates the catalog per template.

## Lanes

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

- CI should stay aligned with local commands in each template.
- When a template adds a new required tool, update the template's own harness and the workflow matrix together.
- When a repo-level change should invalidate every template, add its path to the shared-file filter in `.github/workflows/templates-ci.yml`.
- CI is meant to catch template drift, not to duplicate every release-time check.
