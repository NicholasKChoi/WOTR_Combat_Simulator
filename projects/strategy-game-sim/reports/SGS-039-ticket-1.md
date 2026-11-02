# SGS-039 ticket report (author run 1)

File: projects/strategy-game-sim/tickets/SGS-039-aoe4-triggers-reactions-default-amounts.md
Branch: sgs-039-aoe4-triggers-reactions-default-amounts. Component aoe4-build-order. Risk high. On merge: none (the outline names none; no REPO.md command, CONTEXT.md doc or Decisions line changes).

## Summary
Adds the `depleted` and `bank` Trigger kinds, `BuildStep.reaction`, `triggerHolds` cases, `triggerWakeAt`, reaction arming and offer order in `offerSteps` (reactions first, cursor skips them, never reserve), the per-kind trigger and reaction validation table plus `SIM_INPUT_BOUNDS.triggerAtLeast`, the six owner-supplied amounts in `rules/base.json`, one gold reaction in ENG 1TC, and the five-part prebuilt bar in `builds.test.ts`. Also: OpenAPI (Trigger 2 -> 4 variants, `reaction` on 6 BuildStep variants, ResourceKind now referenced), contract spec edits, and the doc sections it makes untrue. About 210 business-logic lines (under the outline's L); depends on SGS-038 and SGS-042.

## Facts measured (throwaway worktree on main, removed)
- ENG 1TC gathers about 1403 gold by 1200 s and 4364 by 3600 s with 2 gold villagers from about 80 s. Deposit 1 (4000) runs out near 3305 s, `gold#2` does not run out by 3600 s: one reaction (`gold` -> `gold#2`) suffices, N = 2. It rallies to wood from 140 s, so no rally reaction.
- Sheep (3000) runs out near 760-770 s, after the last of ENG 1TC's 24 steps starts (508 s). Idle sheep is allowed by the bar.
- Default `durationSeconds` is 1200, so depletion changes default-duration results of any existing test that outlasts an amount; the ticket fixes those with `nodeAmounts` null overrides, not new baselines.
- Grep/jq criteria checked against main: validate.ts has 1 line with the two-kind test; simulate.ts has 1 inline `trigger?.kind === 'time'`; Trigger oneOf 2; 0 BuildStep variants with `reaction`; ResourceKind unreferenced (0 refs); base.json 0 `amount`; ENG 1TC 24 steps, 0 reactions; docs grep finds 3 lines. No mutation check could run today because the tests are new.

## Diagram
One read/act/record flowchart (offerSteps, cursor, nextWake changes). No component-crossing diagram (single component).

## Open questions
1. (designer/manager, blocks dispatch) Plan defect: the ENG 1TC reaction is JSON-only until F. `pages/apps/aoe4-build-order.tsx:23` builds the prebuilt text with `formatBuildOrderText`, which drops a `depleted` trigger (`formatTrigger` default) and prints `all` bare; the ENG 1TC text then fails to parse and the Playwright spec "runs the default prebuilt build..." (`acceptance/aoe4-build-order.spec.ts`) goes red when E merges alone. Owner answer 4 only moves the round-trip test to F. Options: merge E and F as one unit, or move the ENG 1TC step and its half of bar parts 4-5 into F.
2. (designer) The wait-time helper name is only proposed by SGS-042 (`accrueWait(engine, stepIndexes, seconds)`); E calls it for reactions.
3. (designer) A reaction waiting on resources wakes at its affordability instant via a wake-only list (not `engine.reserve`, not `engine.needs`, which `startProduction` clears). Design is silent; confirm.
4. (designer) Validation treats reactions like any step in list order, so a `rally` reaction counts as a rally source and a `research` reaction counts for the duplicate-research rule. Confirm or specify.
5. (designer) SGS-038 does not fix what `nodeRefIssue` returns; E emits it for `trigger.node`.

Not depended on (no action): `recordRunOut`/`recordIdleArrival`/`sortWarnings` names (D and C use them; E only reads `isDepleted`), the m:ss formatter location and `step-stuck` wording (E adds no messages), `waitingOn` for an unregistered action.

## Overlap
- simulate.ts: SGS-038 (D, parent), SGS-042 (H, sibling; E reuses its helper and horizon pass), SGS-035 (export-list test).
- validate.ts: SGS-036 (B, `steps.forEach` loop at validate.ts:189, rebase only) and SGS-038 (`nodeRefIssue`).
- depletion.ts `runRefs`: one-line extension left by SGS-037.
- builds.test.ts and the round-trip test: SGS-040 re-adds the round trip. openapi.json: SGS-037/038/042 edit other schemas; docs/aoe4-build-order.md: D, H, G also edit; E re-reads before editing.
- SGS-050/051 reuse the bar test E writes.
