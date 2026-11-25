# Simplify report: SGS-215 (production past population cap)

Branch sgs-215-production-past-population-cap, tip 1871d68. Loaded common.md, LESSONS.md (Playwright layout lesson, not touched by this diff), ARCHITECTURE.md, tsconfig.json. Invoked /simplify with the Skill tool in the task checkout.

I reviewed the diff (14 files, lib/aoe4-build-order and acceptance) across the four angles (reuse, simplification, efficiency, altitude) myself. I did not launch the four cleanup subagents.

Considered and skipped:
- `hasPopulationRoom` uses `!= null`. The unit test passes a state without the field, so tightening it changes tested behavior.
- Local `last` helpers in the new specs repeat a one-liner. Sharing them would touch files outside the diff, and the jscpd threshold is not hit.
- `expectNoPopulationWaitAfterCap` has one call site, but its body is longer than its comment, so it stays.
- The production code change is already minimal: `populationCapReachedAt` moved to `EngineState`, one shared predicate at both call sites, no special cases.

No edits made, no commit. Unit tests not re-run because nothing changed.

simplify-proof: sgs-215-production-past-population-cap no-change /simplify reviewed the diff and changed nothing.
