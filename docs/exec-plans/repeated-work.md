# Repeated Work

## Doc Gardening

The knowledge base needs periodic manual gardening.

Basic doc correctness is now checked by `npm run docs:check` in the source repo, including required files, relative links, registry metadata alignment, and documented `just` commands.

Repeat this manual work when template behavior, architecture rules, onboarding flow, or product framing change:

- review `AGENTS.md` and `ARCHITECTURE.md`
- review `docs/design-docs/` and `docs/product-specs/` for stale guidance
- move stale execution plans from `active/` to `completed/`
- update `tech-debt-tracker.md` when cleanup work is discovered
- remove outdated or irrelevant references that no longer match the stack
