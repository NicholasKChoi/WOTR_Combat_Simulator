# SGS-069 implementer report 1

Branch sgs-069-aoe4-timeline-blocked-by-compare, tip 201238a47e9dea501853530c1d4a7b1434c08d38, base origin/main 54d7e90.
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-069-aoe4-timeline-blocked-by-compare

Status: needs_review

## Files
- components/apps/aoe4-build-order/step-timeline-rows.ts: `blockedBy`, `longWait`, exported `LONG_WAIT_SECONDS = 60`.
- components/apps/aoe4-build-order/step-timeline.tsx: Blocked by column, `ongoing`, `data-long-wait`, `step-timeline-scroll` wrapper.
- components/apps/aoe4-build-order/compare.ts: `KeyValue`, reasons, omitted rows, delta and direction.
- components/apps/aoe4-build-order/compare-panel.tsx: value and delta text, `data-direction`, colour classes, `compare-empty`, `compare-scroll`; props unchanged.
- docs/aoe4-build-order.md: timeline and compare paragraphs rewritten.
- Tests: step-timeline-rows.test.ts, compare.test.ts, acceptance/aoe4-build-order-pin-compare.spec.ts, acceptance/aoe4-build-order-m3-flow.spec.ts, acceptance/aoe4-build-order.spec.ts.

## Tests
- `npm test`: 40 files, 1094 passed, 8 skipped. `npm run acceptance`: 556 passed.
- Unit invariants: blockedBy text per status and breakdown; longWait boundary 59.9 / 60 / 61; keyNumbers reasons (run-ended, not-reached, pop-cap 0 is a value); omitted rows only when both blank; delta only with both values; direction per row kind including same and null.
- Added acceptance: long wait (`data-long-wait`, table-warning, Blocked by text, header cells, scroll wrapper), waiting en dash, `ongoing`, `compare-empty`, `compare-scroll`, `data-direction` with text-success/text-danger.

## Pre-existing tests edited
- step-timeline-rows.test.ts: none changed (new cases added).
- compare.test.ts: all three `keyNumbers` tests and the `compareRows` value/delta tests, to the `KeyValue` shapes (ticket: compare.test.ts expected to change). The "delta of current/pinned" table lost its `[null,null,null]` row because that row is now omitted.
- acceptance/aoe4-build-order-pin-compare.spec.ts: "compare table appears..." (row count now a subset check, `signed` renamed `militaryDelta` with new text, age cell reads `not reached`, direction asserts); "pinned 1200 s against 300 s" (current cell `run ends at 5:00` instead of dash); "pinning the shown result" (every delta and direction `same`, `military-1200` omitted at 900 s). Ticket names this file.
- acceptance/aoe4-build-order-m3-flow.spec.ts: the "edit a step in the table..." test, row keys now an in-order subset of COMPARE_KEYS instead of all seven. Ticket names this file.
- acceptance/aoe4-build-order.spec.ts: no existing test edited (three tests added to "step timeline").

## Mutation checks (each reverted)
- `>=` to `>` on longWait: boundary test failed.
- `, ` join of breakdown and still-waiting to a space: blockedBy table failed.
- waiting branch disabled: 3 blockedBy rows failed.
- direction comparison flipped: 6 failed.
- omit filter `||` to `&&`: 4 failed.
- `value == null` to `!value` (treats 0 as not reached): pop-cap 0 case failed.
- A `t > durationSeconds` guard in `militaryAt` passed all tests with it removed, because the times array never holds a sample past the duration; I removed the guard from production code.

## Build / lint
- `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones; `npx next build` succeeded. No codegen configured.
- Greps: `LONG_WAIT_SECONDS = 60` one line; no `pinnedName|alreadyPinned`; no "Waited on|Stuck on" in components, acceptance or docs.

## Notes
- The worktree had no node_modules at creation; ran `npm ci` (no lockfile change).
- Waiting steps report `waitSeconds` 0 (waiting time sits in `waitBreakdown`), so a `waiting` row is never `longWait`; the long-wait acceptance test uses a completed `build barracks with 9 from sheep` step (65 s).
- The acceptance criterion "an age missing on one side shows `not reached`" is covered in the compare-table test; the 1200 s vs 300 s default build has no age rows, so that test checks only `run ends at 5:00` and the dash delta.
- Invariants: display-only; no engine or API change; A1 to A3 untouched.

## Out-of-scope findings
None.
