# Plans

Plans are first-class artifacts in this scaffold.

## Planning Model

- small, transient work may use a short local plan without a committed plan file
- complex or multi-step work should create an execution plan in `docs/exec-plans/active/`
- finished execution plans move to `docs/exec-plans/completed/`
- known cleanup and follow-up items live in `docs/exec-plans/tech-debt-tracker.md`
- repeated operational work belongs in `docs/exec-plans/repeated-work.md`

## Required Sections For Execution Plans

Every execution plan in `active/` or `completed/` should include:

- `## Status`
- `## Scope`
- `## Steps`
- `## Progress Log`
- `## Decision Log`

## Operating Rule

Execution plans, completed plans, and tech debt are all versioned and stored in the repository so agents can work without hidden external context.
