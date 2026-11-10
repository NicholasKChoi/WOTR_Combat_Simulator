# SGS-108 review 2 (after rework 1)

- Task: SGS-108 step run cell; charts dim on stale
- Branch: sgs-108-step-run-cell, tip d964ace (local only)
- Diff reviewed: adde412..d964ace. The rework range d526ce3..d964ace was reviewed line by line. The rest of the diff is byte-identical to what review 1 reviewed at d526ce3.
- Verdict: **APPROVE**

## Rework 1 required fixes

| # | Required fix | Met | Evidence |
|---|---|---|---|
| 1 | (text) In `docs/aoe4-build-order.md:1006-1007`, replace the clause with "so it is absent while an edit to a current result waits the 500 ms to settle." | yes | The line now reads exactly that. Checked against the code: `statusDescribesResults(stale, status, hasResult)` returns `stale && autoRunStatusMessage(status, hasResult) !== ''` (`auto-run-status.ts:21-23`), and the `current` status has empty text, so the attribute is absent in that window. |
| 2 | Add a `run({runStep:1, waitSeconds:59.9, longWait:false})` row to the long-wait test and assert it has no `data-long-wait` | yes | `step-annotation.test.ts` adds a fourth text line, so the order has three steps, plus a third annotation. The test asserts `data-run-step="1"` and no `data-long-wait` on that row. Mutation check: I changed `step-table.tsx:328` from `run?.longWait ?` to `run ?`. The test failed ("expected ' data-step="2" ...' not to contain 'data-long-wait'"). I then reverted the change. |
| 3 | Add `expect(styles.stale).not.toBe('')` | yes | Added beside the `styles.warn` check. This assertion cannot fail; see note N1. |

## Blocking findings

None.

## Spec gaps

None blocking. See N1: an acceptance-criterion precondition is vacuous under this repo's Vitest config.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | data-kind, started/finished vs API, one legend | pass | No production change since review 1. `aoe4-step-annotations.spec.ts` was re-run here and passes. |
| 2 | Kind colour on screen; badge absent for `other` | pass | Same spec, re-run, passes. |
| 3 | not-reached / empty blocked-by / long-wait >= 60 / flagged background | pass | Same spec, re-run, passes. |
| 4 | Unit table (StepRunCell and StepTable) | pass | The 59.9 s `longWait:false` row is now present and pinned (fix 2; the mutation check above confirms it can fail). The other cases are unchanged from review 1. |
| 5-8 | Stale cases 1-4 | pass | Re-run here, passing. The specs are unchanged from review 1. |
| 9 | `annotationToneClass` unit table | pass | Both keys are now asserted non-empty and different, as the criterion words it. The 13 rows still compare against `styles.warn` and `styles.stale`. N1 covers how much the key precondition proves. |
| 10 | `StepTimes` exported and shared | pass | Unchanged from review 1. |
| 11 | `statusDescribesResults` unit table | pass | Unchanged; `npm test` passes. |
| 12 | `resultsStale` wiring | pass | Unchanged from review 1. The weak aria assertion is review 1 N3, already in the backlog. |
| 13 | Layout at 1280 | pass | Unchanged from review 1, and the spec passes on re-run. |
| 14 | No `workbenchSplit > :first-child` overflow rule | pass | Unchanged. |
| 15 | Kind colours exist once; lint:dup clean | pass | `npm run lint:dup`: 0 clones. |
| 16 | Docs wording | pass | The false aria-describedby clause is replaced (fix 1). The other wordings are unchanged from review 1, where they passed. |
| 17 | Existing specs; test suites | pass | `tsc --noEmit` is clean. `npm test`: 1970 passed, 10 skipped. I re-ran `aoe4-step-annotations.spec.ts` and `aoe4-build-order-pin-compare.spec.ts` (48 passed). Review 1 ran the full acceptance suite (870 passed) on identical production code. |
| 18 | No INVARIANTS.md regressions | pass | The rework touches only a unit test and one docs sentence. |

## Invariants

The diff touches nothing under `lib/`, the API, `docs/api/openapi.json` or data, so A1-A3 hold. Review 1's analysis still applies: pinned runs never feed `buildAnnotations`.

## Bot reconciliation

No review bot is configured (`reviewBot.cli` is empty).

## Lint

`npx tsc --noEmit` is clean, and `npm run lint:dup` finds 0 clones.

## Non-blocking notes

- N1 `components/apps/aoe4-build-order/step-annotation.test.ts:33-39` ("keys the two tones to different class names") cannot fail in this repo. `vitest.config.mts` sets no `css` option, so Vitest does not process `.module.css` files. Instead it returns a proxy that makes up a stable hashed name for any key it is asked for (`_stale_a8c3d8`). I renamed `.stale` to `.staleRemoved` in `step-annotation.module.css` and the whole unit file still passed (27/27).
  - So the precondition the criterion asks for ("the two keys are non-empty strings and differ"), including the assertion added for fix 3, proves nothing about the CSS.
  - The tone table is still useful: it catches a wrong key or a wrong condition in `annotationToneClass`.
  - The real guard against losing the stale opacity is the acceptance check of computed opacity `0.5` on `step-run` (stale case 1), and that check passes.
  - This is not blocking, because the ticket requires these assertions and the implementer wrote them as specified.
  - Suggested follow-ups: add a backlog or spec-checklist item that unit criteria must not use CSS-module key presence as a precondition under the default Vitest CSS handling. Alternatively, set `test.css: { include: [/\.module\.css$/] }` so missing keys come back `undefined`.
- Review 1 notes N1-N8 are already in the backlog and were not re-raised. All of them still apply, because no production code changed.

## Coverage

- Files reviewed:
  - `components/apps/aoe4-build-order/step-annotation.test.ts` and `docs/aoe4-build-order.md`, the rework changes.
  - `auto-run-status.ts:21-23`, to check the docs claim.
  - `step-table.tsx:328`, for the mutation check.
  - `vitest.config.mts`.
  - Everything else in adde412..d526ce3 was reviewed in review 1 and is unchanged.
- Commands run in a detached review worktree at d964ace, since removed:
  - `npm ci`
  - `npx tsc --noEmit`
  - `npm run lint:dup`
  - `npm test`
  - `npx playwright test acceptance/aoe4-step-annotations.spec.ts acceptance/aoe4-build-order-pin-compare.spec.ts` (48 passed)
  - two mutation checks, both reverted
- Not re-run: the full acceptance suite, `npx next build`, and the multi-width screenshots. Production code is identical to d526ce3, where review 1 did all three.
- No REVIEW.md exists in the repo, and there is no review bot.
