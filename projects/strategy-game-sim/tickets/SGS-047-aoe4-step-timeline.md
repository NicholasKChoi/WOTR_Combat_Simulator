# SGS-047: Show a per-step timeline of start, finish and wait reasons on the AoE4 page

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.5 (per-step timeline with started/completed/waitingOn, flagged steps)
- **Priority**: medium
- **Risk**: low
  <!-- One component, no `lib/**` edit, no API or schema change, no adjacent invariant, about 70 lines of business logic. It edits results.tsx and the page, which SGS-045, 046, 048 and 049 also edit: rebase only. -->
- **Invariants**: none adjacent (A2 is about the engine's waits; this ticket only displays what SGS-042 reports)
- **LOC estimate**: ~70 (`step-timeline-rows.ts` ~35, `step-timeline.tsx` ~35, `results.tsx` and page wiring ~10; tests excluded)
- **Depends on**: SGS-042 (`StepTiming.waitingOn`, `StepTiming.waitBreakdown`), SGS-040 (`formatBuildStep`), SGS-035 (moves `formatMinSec` to `lib/aoe4-build-order/format-time.ts`); transitively SGS-039 (`BuildStep.reaction`)
- **On merge**: none
- **Source**: design/M3.md "Page props and test ids" (`step-timeline`, `step-timeline-row`), Behavior rules row `timeline | rows`, "Step status" tables; plan M3-20261101 outline M

## Context

After SGS-042 every `StepTiming` says why a step waited (`waitingOn`, `waitBreakdown`), but the page shows only charts and
messages. M3.5 asks for one row per step: when it started and finished, how long it waited and on what, with steps still
waiting or never reached flagged. The step text comes from the pasted text parsed at the run click, because the response
carries no step text.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted. The bundle must not import `lib/aoe4-build-order/data.ts`
(`parse-text.ts` imports only types from `model.ts`, so importing it is fine).

1. **`step-timeline-rows.ts`** (new, pure, no React, so vitest can reach it: `vitest.config` includes `components/**/*.test.ts` only):
   `timelineRows(steps: StepTiming[], text: string): TimelineRow[]`. It runs `parseBuildOrderText(text)` once. For each
   `StepTiming` it returns `{ step, label, status, startedAt, completedAt, waitSeconds, waitBreakdown (non-zero entries in the
   fixed order resources, villagers, population, prerequisite), waitingOn, flagged, reaction }`:
   - `label` = `formatBuildStep(order.steps[timing.step])`; if the text does not parse or the index has no step, `label` is
     `step <n>` with `n` 1-based (the page only reaches this with a response for the same text, so this is a guard, not a feature).
   - `flagged` = `status` is `waiting` or `not-reached`; `reaction` = the parsed step's `reaction === true`.
   - `waitingOn` is passed through (`null` for `in-progress` and `completed`).
2. **`step-timeline.tsx`** (new): `StepTimeline({ steps, text })` renders `timelineRows` (memoized on `steps` and `text`) as a table with
   `data-testid="step-timeline"` and one `data-testid="step-timeline-row"` per row with `data-step` (the 0-based `step`),
   `data-status`, `data-flagged="true"` (attribute absent otherwise) and `data-reaction="true"` (absent otherwise). Cells:
   label; `startedAt` and `completedAt` as `m:ss` through `formatMinSec` imported from `lib/aoe4-build-order/format-time` (respec 1; `chart-rows.ts` no longer exports it) (an en dash for `null`); `waitSeconds` as
   `m:ss`; the non-zero `waitBreakdown` reasons as `<reason> <m:ss>`; for a flagged row its `waitingOn` id. Renders nothing for
   an empty `steps` (a `start`-only paste). Layout and styling are the implementer's (Bootstrap classes, `cn`); the fixed contract is
   the ids and attributes above.
3. **`results.tsx`**: `Results` gains `text: string` and renders `<StepTimeline steps={result.steps} text={text} />` above the charts and below the message lists
   SGS-045 adds.
4. **`pages/apps/aoe4-build-order.tsx`**: a `resultText` state holds the text the shown result was run with. `runSimulation` captures `text` at the click, sets
   `resultText` together with `setResult` on success, and clears the result as today on a failed run (`resultText` is not read then). Editing the textarea
   afterwards does not change the timeline labels. Pass `text={resultText}` to `Results`.
5. **Tests**:
   - `step-timeline-rows.test.ts` (new, vitest): labels equal `formatBuildStep` of the parsed step; a `depleted` reaction row has `reaction: true` and a `whenever ...` label; `waiting` and `not-reached` rows are flagged and the others are not;
     breakdown entries are non-zero and in the fixed order; unparsable text and an out-of-range index give `step <n>` labels and do not throw.
   - `acceptance/aoe4-build-order.spec.ts` (Playwright): a real run of the default prebuilt build shows `step-timeline` with one `step-timeline-row` per `steps` entry of the response (`data-step` 0..n-1, each `data-status` equals the response's); the row for the ENG 1TC reaction has `data-reaction="true"` and
     `data-status="not-reached"` at 1200 s with `data-flagged="true"`. A run of a paste with a step that cannot start (`start -> sheep` then `build kings-palace from wood`) has that row `data-status="waiting"`, `data-flagged="true"`, and the response's `waitingOn` value in its text. After the run, editing the textarea leaves the row labels unchanged. A 400 run shows no `step-timeline`.
6. **`docs/aoe4-build-order.md`** (page section, ~line 560-571): add the timeline (one row per step in step order, columns, flagged rows, reaction marker, label from the text at the run click, absent for an empty `steps` and for a 400). T audits the whole doc.

**Out of scope:** any engine, API or OpenAPI change (`waitingOn`, `waitBreakdown`, `reaction` come from SGS-042 and SGS-039 as given); `step-stuck` warnings (shown by SGS-045's list); the step table and its sync with the text (SGS-046); pin/compare and chart markers (SGS-048, SGS-049); a timeline for the pinned run; `step-timeline` wording beyond the fixed ids (design leaves it open).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `git grep -n -i "step-timeline" -- components pages acceptance` finds 0 matches today and the ids `step-timeline` and `step-timeline-row` after; `git grep -n "data/\|/data'" -- components/apps/aoe4-build-order/step-timeline.tsx components/apps/aoe4-build-order/step-timeline-rows.ts` finds nothing; `git grep -n "chart-rows" -- components/apps/aoe4-build-order/step-timeline.tsx` finds nothing and `git grep -n "format-time" -- components/apps/aoe4-build-order/step-timeline.tsx` finds the `formatMinSec` import (respec 1).
- [ ] A successful run renders `step-timeline` with exactly one `step-timeline-row` per `result.steps` entry, in order, `data-step` equal to the index and `data-status` equal to the entry's `status` (Playwright, default prebuilt build).
- [ ] Each row's label is `formatBuildStep` of the step parsed from the text that was run (unit test on `timelineRows`; Playwright checks the first row's text contains `produce villager`).
- [ ] `startedAt`, `completedAt` and `waitSeconds` show as `m:ss`; a `null` time shows an en dash; only reasons with a non-zero `waitBreakdown` value are listed, in the order resources, villagers, population, prerequisite (unit test).
- [ ] A `waiting` or `not-reached` row has `data-flagged="true"` and shows its `waitingOn`; `in-progress` and `completed` rows have neither the attribute nor a `waitingOn` (unit test and Playwright, the `build kings-palace from wood` paste for `waiting`).
- [ ] A reaction step's row has `data-reaction="true"` and a `whenever` label; no other row has the attribute (the ENG 1TC row, Playwright).
- [ ] Editing the textarea after a run leaves the timeline labels unchanged until the next run; a second run with the new text updates them.
- [ ] A 400 or failed run shows `simulation-error` and no `step-timeline`; a `start`-only paste (empty `steps`) renders no `step-timeline`.
- [ ] `timelineRows` with text that does not parse, or a `step` index past the parsed steps, returns `step <n>` labels and does not throw (unit test).
- [ ] `docs/aoe4-build-order.md` describes the timeline; `git grep -n "timeline" -- docs/aoe4-build-order.md` finds a hit in the page section (0 hits today).
- [ ] `npx tsc --noEmit`, `npm test`, `npm run acceptance` pass; the page loads at 1280 px with the timeline and the three charts and no horizontal overflow of the timeline table.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
