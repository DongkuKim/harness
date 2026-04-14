# CI

The GitHub workflow in `.github/workflows/templates-ci.yml` validates the catalog per template.

## Lanes

- `fast`: lint and typecheck
- `test`: unit and integration coverage
- `ux`: Playwright-based UX checks

## Matrix Strategy

- Each template runs through the same lane structure.
- Python and Rust toolchains are added only when a template needs them.
- Rust-specific templates may install extra tools such as `cargo-nextest` or `cargo-udeps`.

## Operational Notes

- CI should stay aligned with local commands in each template.
- When a template adds a new required tool, update the template's own harness and the workflow matrix together.
- CI is meant to catch template drift, not to duplicate every release-time check.
