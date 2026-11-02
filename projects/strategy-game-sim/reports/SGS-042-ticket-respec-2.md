# SGS-042 ticket re-spec 2

Ticket: tickets/SGS-042-aoe4-step-wait-step-stuck.md (id, file and graph row kept). Input: reports/SGS-042-spec-gate-1.md (NEEDS_SPEC, two gaps).

## Gap 1: stale "empty today" claim
- Item 8 (OpenAPI): reword `SimulationResult.warnings` (and `SimWarning`/`depletions` if they carry it) so nothing says the list is empty today; name `step-stuck`.
- Item 10 (docs, `## Outputs`): reword SGS-037's "both lists are always empty today" sentence (SGS-038 may have changed the `depletions` half); `warnings` holds node warnings plus one `step-stuck` per waiting step.
- New criterion: `git grep -n -i -E "empty today|always empty" -- docs/aoe4-build-order.md docs/api/openapi.json` finds 0. Ran on origin/main: 0 (SGS-037 not merged; it introduces the phrase).

## Gap 2: overlapping handlers
- Depends on now SGS-037, SGS-038, SGS-041 (manager updates graph dependsOn).
- Item 2 states the merged-tree meaning: research `prerequisite` = `researchTarget` finds nothing or `researchEntry` returns undefined; `move` returns `villagers` only for numeric `count`, never `move all`; build/move villagers check uses `availableAt(state, step.from)`.
- Item 7: `step-stuck` merges into the list SGS-038 fills from `depletionResults`, before the one `sortWarnings` call; criterion: exactly one `sortWarnings(` call in simulate.ts (0 on main; SGS-037 adds it).
- New criteria: `move all` from 0 villagers starts with `waitingOn: null`; research tier-above-age / no instance → `prerequisite`; node warnings and `step-stuck` coexist in sort order.
- All line cites re-anchored by function, describe or test name (finalStatus loop = `engine.steps.forEach` in `simulateBuildOrder`, main ~693-695; handlers by const name; tests by `it`/`describe` title; docs by heading/paragraph opening).

## Criteria checked on origin/main
- `{ started: false }` grep: 5 (matches Scope).
- "empty today|always empty" grep in docs/openapi: 0.
- `sortWarnings(` in simulate.ts: 0 (added by SGS-037).
- `jq '.components.schemas.StepTiming.required'`: neither new key present.

## Open questions
None.
