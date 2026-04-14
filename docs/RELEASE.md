# Release

The release flow is intentionally small and explicit.

## Source Of Truth

- `package.json` defines the published package name, binary, and release script.
- `bin/dk-harness` is the CLI that gets published.
- `templates/` and `templates/registry.json` are copied into the npm tarball.

## Release Check

- `npm run release:check` runs `scripts/release-pack-check.mjs`.
- The script packs the npm tarball, inspects required entries, and smoke-tests the installed CLI.
- The smoke test verifies both `dk-harness list` and `dk-harness new next-monorepo ...`.

## Release Expectations

- Template edits should not break the package layout.
- A template that cannot be listed or scaffolded is a release-blocking regression.
- If the tarball shape changes, update the release check and the docs together.
