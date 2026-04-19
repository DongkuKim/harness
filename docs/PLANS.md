# Plans

Plans are first-class artifacts in this repo.

## Planning Model

- Prefer short, concrete plans over open-ended task lists.
- Small, transient work may use a short local plan without a committed plan file.
- Complex or multi-step work should create an execution plan in `docs/exec-plans/active/`.
- Finished execution plans move to `docs/exec-plans/completed/`.
- Known cleanup and follow-up items live in `docs/exec-plans/tech-debt-tracker.md`.
- Repeated operational work belongs in `docs/exec-plans/repeated-work.md`.

## Root Repo Planning Expectations

- Make module- and preset-impacting changes in small steps so regressions are easy to localize.
- When a change affects release packaging, workflow behavior, or scaffold composition, document that relationship in the same change.
- Prefer versioned plan files over hidden external context for cross-session work.

## Required Sections For Execution Plans

Every execution plan in `active/` or `completed/` should include:

- `## Status`
- `## Scope`
- `## Steps`
- `## Progress Log`
- `## Decision Log`

## Operating Rule

Execution plans, completed plans, and tech debt are all versioned and stored in the repository so agents can work without hidden external context.
