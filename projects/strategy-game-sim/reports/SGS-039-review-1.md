# SGS-039 review 1 (full review, high care)

Verdict: **APPROVE**

Branch `sgs-039-aoe4-triggers-reactions-default-amounts`, tip c1d71a5, merge-base 2665e94. The branch is local only (not on origin). origin/main has moved to a2e3ade since the merge-base, so a rebase may be needed before the PR.

## Blocking findings

None.

## Spec gaps

None blocking. One follow-up for the spec owner (see note 1): should a `build house` step marked `reaction` count as "the last build house step" for the auto-house gate?

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 126 | depleted trigger | pass | simulate-triggers.test.ts `depleted trigger` block; armedAt = startedAt = depletedAt, not a sample multiple; null / ungathered / horizon cases not-reached + trigger and valid; gold#3 stock created |
| 127 | bank trigger | pass | `bank trigger` block; handler-observed bank within RESOURCE_TOLERANCE of 400; idle resource never arms; 0 holds at once; checked before villager payment (armedAt 0, food sampled below start); earlier-step case |
| 128 | triggerWakeAt | pass | unit tests for all six cases; inline `trigger?.kind === 'time'` 1 on base, 0 on tip |
| 129 | reaction ordering | pass | `reaction order` block (both placements, later reaction vs waiting cursor, move all then move 2) |
| 130 | reaction vs cursor compete | pass | `reaction and the cursor step compete`; the test uses 50 wood per house, not "the last 100 wood", but it checks the same property |
| 131 | reaction status / single accrual | pass | step-stuck once at runOut, breakdown sums; the accrual grep finds the single site simulate.ts:820 |
| 132 | starts at most once | pass | idle-arrival test |
| 133 | node-depleted interplay | pass | info / 0 vs warning / 3 |
| 134 | validation table | pass | validate.test.ts:534-647 rows; `trigger.kind !== 'time' && ...` 1 on base, 0 on tip |
| 135 | default amounts | pass | jq prints 6; values, sources and `unverified: true` match Scope; no farm/wood; literal grep prints nothing |
| 136 | depletion on by default | pass | `default amounts` block; ENG 1TC at 3600 s: sheep 782.85 s, gold 3305.17 s, no gold#2 (independently measured) |
| 137 | prebuilt bar + mutation | pass | builds.test.ts passes; I made `triggerHolds` return false for depleted and 9 trigger tests failed; source restored |
| 138 | ENG 1TC unchanged | pass | 24 startedAt equal to an all-infinite run (test); berry/deer/boar/stone depletedAt null (measured); english-1tc.json not in diff; nothing moved |
| 139 | existing tests | **unchecked** | suites pass and the pins keep their expected values with the six-null override (depletion-engine x2, spend-population x2). The "PR body lists each edited test" part can't be checked until a PR exists; the PR stage must check it |
| 140 | openapi structure | pass | Trigger oneOf 4, reaction on 6, ResourceKind refs 1, triggerAtLeast bounds; contract spec passes |
| 141 | docs greps | pass | 0 and 0 |
| 142 | openapi nodeAmounts/armedAt | pass | "infinite when absent" 0; armedAt states reaction case |
| 143 | README | pass | both greps 0; bar names both horizons and five parts |
| 144 | determinism | pass | deep-equal test including warnings and breakdowns |
| 145 | source shape / tsc / lint:dup | pass | simulate.test.ts:689 lists triggerWakeAt; tsc 0; lint:dup 0 clones; tolerance imported from engine-common |
| 146 | acceptance | pass | 453 passed |
| 147 | no invariant regressions | pass | see below |

Invariants touched:
- A1 (owner-supplied unverified values stay labelled): holds. All six amounts carry a source and `unverified: true`. There are no amounts in code.
- A2 (a single reserve, so orders are not starved): holds. Reactions never set `engine.reserve`. Their resource hint goes only to `reactionNeeds` for wake times, and the producer-order test confirms order payments are unchanged.
- A3 (determinism): holds. Reactions are offered in step order with no Map/Set iteration-order dependence, and the deep-equal test passes.
- S3 (no copied helpers or tolerances): holds. RESOURCE_TOLERANCE is imported, and `nodeRefIssue` is reused for `trigger.node`.

## Commands

`npx tsc --noEmit` 0; `npm run lint:dup` 0 clones; `npm test` 934 passed (37 files); `npm run acceptance` 453 passed; `npx next build` OK. I loaded the page on the dev server at 1280 px: with ENG 1TC selected, Run simulation shows "sheep ran out at 13:03; 6 villagers are idle there.", with no console or page errors and scrollWidth 1280 (no overflow). I stopped the dev server and the port is free.

## Bot reconciliation

`reviewBot.cli` is empty and there is no `rulesFile`, so no bot ran.

## Non-blocking notes

1. simulate.ts `houseGateOpen` (~570): a reaction `build house` step that never fires still counts as the last `build house` step, so if it sits at the end of the list (where the design puts reactions), auto-houses stay off for the whole run. This matches the doc ("if that step never starts they stay off"), and the design doesn't cover it. Spec follow-up: decide whether reactions should be excluded from the gate.
2. simulate.ts doc (~205, ~281, ~686 `resources` row): "reserves only when ..." / "the only reason that reserves" leaves out "and only for a non-reaction step" (design line 380 includes it). Not wrong, but less precise than the design.
3. Several new doc-comment lines in simulate.ts go past the file's ~110-char wrap (lines 93, 162, 168, 364, 441, 614, 677, 777).
4. data/aoe4-build-order/README.md: "The five starting sheep ..." sits next to the base.json source "15 sheep x 200 food". This may confuse readers ("five" is pre-existing wording).
5. openapi.json: the bank description "armed at the exact instant income reaches it" holds only when the step is the cursor (behind an unstarted step it arms when that step starts). The depleted description wording "runs out on" reads awkwardly.
6. docs: "The paste format does not accept deposits or `move all` yet" doesn't mention the new triggers or `reaction`. The paste format is out of scope here (SGS-040).
7. model.ts comment "bank holds while the stock of resource is at least atLeast" uses "stock", which elsewhere means node stock. "bank" would be clearer.

## Coverage

I fully reviewed: lib/aoe4-build-order/{simulate.ts, model.ts, depletion.ts, validate.ts, test-helpers.ts}, simulate-triggers.test.ts, the validate.test.ts trigger table, builds.test.ts, simulate.test.ts source-shape, data/aoe4-build-order/rules/base.json, data/aoe4-build-order/README.md, docs/aoe4-build-order.md, docs/api/openapi.json, acceptance/helpers.ts and the four re-pinned acceptance tests. I checked the REPO.md AoE4 review checklist: no copied helper or tolerance, docs aren't contradicted by the code, and the page loads at 1280 px. Not reviewable yet: the PR-body parts of criteria 138/139.
