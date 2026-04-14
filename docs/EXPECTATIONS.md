# Expectations

This repo is a harness for agentic development, so the standards are intentionally opinionated.

## Planning

- Prefer short, concrete plans over open-ended task lists.
- Make template-impacting changes in small steps so regressions are easy to localize.
- When a change affects release packaging, workflow behavior, or template scaffolding, document that relationship in the same change.

## Reliability

- Favor fast, deterministic checks that can run locally and in CI.
- Keep release and CI checks aligned with the commands an agent would actually use.
- Treat scaffold smoke tests and workflow validation as part of product reliability, not as optional extras.

## Quality

- Keep the catalog small and intentional.
- Favor repo-local commands, explicit boundaries, and clear source-of-truth files.
- Avoid adding docs or automation that restate the same rule in multiple places unless there is a real audience difference.
- Prefer concise docs that help an agent act correctly on the first pass.
