# Quality Score

Use this rubric when reviewing changes to the root repo, module catalog, preset fixtures, or scaffold CLI.

## High Quality Means

- `templates/modules/` stays the source of truth for scaffold sources
- `scaffolds/presets/` stays the source of truth for curated fixture compositions
- the module catalog stays small and intentional
- docs match the actual command surface, workflow files, and release checks
- repo-local commands are explicit and fast enough to run during normal work
- release, docs, and CI checks reinforce each other without restating the same rule in too many places
- packaging and scaffold verification fail before broken modules or stale fixtures reach publish

## Red Flags

- docs or automation restating the same rule in multiple places without a clear audience difference
- module or preset changes that are not reflected in manifest validation, fixture freshness checks, packaging checks, or workflow coverage
- generated output being edited directly instead of changing the source module, preset, or asset first
- stale local commands or broken relative doc links
- adding one-off modules, presets, or repo conventions without a clear ownership boundary
