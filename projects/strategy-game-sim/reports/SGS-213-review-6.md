# SGS-213 review 6

Verdict: **REQUEST CHANGES**

- Branch `sgs-213-step-popover-beside-text`, tip 1e46dd41cc33966556a16201980fe1f691e39120, base `origin/main` 5eac2142954b5a42351f433956297e4b921f77bc. Full review (not delta mode). Ticket type Bug, risk standard, milestone none.
- Scratch: `worktrees/review-sgs-213-step-popover-beside-text` (removed after this report).

## Blocking findings

1. `components/apps/aoe4-build-order/annotation-popover.test.ts:49-71` - convention - five `it` blocks the diff adds ("keeps a fallback popover inside the viewport when the anchor is near the right edge", "clamps a beside placement vertically when the anchor is near the viewport bottom", "clamps a beside placement vertically when the anchor is above the viewport top margin", "puts a fallback popover above the anchor when it does not fit below", "clamps a fallback popover to the top margin when it fits neither below nor above the anchor") each do only `placePopover(rects(<overrides>))` compared with an expected position; they differ only in input and expected value. common.md Tests requires those as rows of one table, and the sibling tests in `components/apps/aoe4-build-order/step-annotations.test.ts:82`, `:206`, `:281` use named `it.each` tables (the same diff's `hasPopover` table at `step-annotations.test.ts:565` does too). - why: the review Bar makes three or more such blocks always blocking. - direction: replace the five blocks with one `it.each<[string, Partial<PlacementRects>, { left?: number; top?: number }]>([...])('%s', (_, overrides, expected) => expect(placePopover(rects(overrides))).toMatchObject(expected))`, one row per current block with the same name, the same overrides and the same expected values (rows 1 and 2 keep both `left` and `top`: `{ left: 1200 - 200 - 8, top: 324 }` and `{ left: 600 + 4, top: 800 - 60 - 8 }`; the other three keep `top` only: `8`, `760 - 4 - 60`, `8`). Keep the first three blocks (they carry precondition assertions or compare two calls) as they are. Re-run the mutation breaks recorded for these rows (beside top unclamped, fallback always-below, fallback left unclamped, fallback top clamp removed) against the table.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

1. (respec 1) Beside the textarea at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`, hover and caret, unconditional: **pass**. `acceptance/aoe4-step-annotations.spec.ts:339-365` loops both viewports and both inputs, asserts `rightOfTextarea` and `apart` (box intersection) with no skip, all rects read in one `evaluate` under `expect.poll`. Implementer's base run records all 4 failing on `rightOfTextarea: false`. Inspection confirms popover left 595 / 635 / 895 vs textarea right 591 / 631 / 891 at 1200 / 1280 / 1800, `intersectsTextarea: false` in every hover and caret case.
2. (respec 1) Top within 1 px of a mid-list centred line; last line inside the viewport: **pass**. `levelWithLine` at spec:359 after `scrollIntoView({ block: 'center' })`; mutation `top = anchor.bottom` fails it (implementer record). The viewport test (spec:311-337) keeps its inside-viewport assertion, now on the first and last popover steps (the last is the `not-reached` last line in this data). Inspection: hover mid line top 483 = line top 483 (1200, 1280), 533 = 533 (1800).
3. (respec 1) Unit test on the pure placement function (room right, too little room, anchor near bottom; anchor left well left of textarea right): **pass** on content. `placePopover` takes rects only (`annotation-popover.tsx:25`); default anchor left 40 vs textarea right 600; the "ignores the anchor left edge" row and the `left = anchor.left` mutation cover the textarea edge. Layout of five of its blocks is blocking finding 1.
4. No-wait step shows no popover on hover or caret; other statuses show one; predicate unit table; acceptance hover+caret count 0 failing at base: **pass**. `hasPopover` (`step-annotations.ts:49`) is `!(completed && waitSeconds === 0)`; table at `step-annotations.test.ts:565-575` covers completed 0/5, in-progress, waiting, not-reached (0 and 5 where meaningful); status-only and wait-only mutations recorded failing. Spec:210-235 asserts `data-gutter-active="true"` before `toHaveCount(0)` on both hover and caret, so the zero count is not vacuous; base run fails at spec:221. Inspection: every one of the 42 run lines hovered at 4 widths; the five completed 0-wait lines (indices 3, 5, 7, 8, 15) show no popover, every other line shows one.
5. (respec 1) Combined-run rule unit tests: **pass**. `step-annotations.test.ts:577-589`: two zero-wait completed copies give false; first copy no wait plus a 7 s copy gives true while `hasPopover(first)` is false (the single-copy alternative fails, recorded mutation). Production applies it to `annotation.run`, which is `combineRuns(copies)` (`step-annotations.ts:232`).
6. Existing popover tests keep their assertions and pass on popover steps: **pass** (by reading; implementer ran the file: 31 passed). Caret, shared-active, viewport and blank/comment tests changed only which step they use; the blank/comment test adds a precondition that its last step shows a popover. The shared-active test picks `aStep` with `aStep + 1` also a popover step, so its final `ArrowDown` assertion still holds.
7. Docs: **pass**. `docs/aoe4-build-order-ui.md:20` states the beside placement, the fallback and the no-wait exception (with the repeated-step wording); `:106` qualifies the `Blocked by:` sentence. `README.md`, `ARCHITECTURE.md`, `lib/aoe4-build-order/README.md`, `data/aoe4-build-order/README.md`, `page-help.tsx` have no popover statement (grep).
8. No INVARIANTS.md regressions: **pass** (below).

Doc claims checked against code: "opens beside the text (level with its line, to the right of the textarea ...; when there is no room there it falls back to just below the line, or above it near the viewport bottom, and may overlap the text)" matches `placePopover` (`beside <= maxLeft`, else `below <= maxTop ? below : above`, both clamped). "except for a completed step that waited for nothing (for a repeated step, one whose copies all completed with no wait in total)" matches `hasPopover` on the combined run (combined status is the least advanced copy's, wait is the sum). "for a step that has a popover, shows the same text" is true.

Pre-existing tests edited: the rewritten hover test and the step re-selection in the caret, shared-active, viewport and blank/comment tests are all named by the ticket's "Tests that this change alters" rule. No other pre-existing assertion changed.

Bug record: implementer report records the new spec at base 5eac214 failing at `toHaveCount(0)` (spec:221) for the no-wait test, and the 4 placement tests on `rightOfTextarea`; the fix lands at the cause the Context names (`place()` and the `AnnotationLine` guard).

## Invariants

- A1 (game numbers from data files): holds; no simulation code or game number touched.
- A2 (resources never negative): holds; display only.
- A3 (deterministic timings): holds; no randomness or clock in the diff.
- S1-S3, W1-W2, H1-H3: paths not touched.

spec-checklist: Contracts (no API, field or Key surface changed), Scope (nothing out of scope, no `golang/`), Naming (`hasPopover`, `placePopover`, `PlacementRects` state intent), A1-A3: all hold. No open question answered with a constant (the 4 px gap and 8 px margin are the pre-existing constants).

## Lint and build

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npx next build`: succeeded.
- Unit: `annotation-popover.test.ts` and `step-annotations.test.ts`: 123 passed.

## UI inspection

Served the task checkout (`npx next dev`, port 3487) and ran `inspect.cjs` with the task checkout's Playwright; server stopped (port free). Loaded `/apps/aoe4-build-order` (default build ENG 1TC), text view, at 1200x800, 1280x800, 1800x900 (repo checklist widths) and 390x800 (below-minimum fallback).

- Popover presence map: hovered all 42 run lines at each width; no popover on the five completed zero-wait lines, one on every other line (including the in-progress step 0, whose text is `Waited 0:00. Blocked by: nothing`, see notes).
- Placement (hover first / mid / last line, caret mid line): at 1200, 1280, 1800 the popover starts 4 px right of the textarea, never intersects it, sits inside the viewport, and its top equals the line top except where vertically clamped near the bottom (last line, and the caret case at 1200/1280 where ArrowDown left the line at the viewport bottom). At 390 it falls back below/above the line inside the viewport and overlaps the text (accepted by the ticket).
- Overflow in the popover: none. Words wrapped mid-word: none. Page horizontal overflow: none at 1200+ (present at 390, the documented below-minimum horizontal scroll).
- Screenshots read: `shot-1200-hover-mid.png`, `shot-1280-hover-last.png`, `shot-1800-caret-mid.png`. No visual defect; the popover covers part of the results column, which the ticket allows.

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty; section skipped.

## Non-blocking notes

- `docs/aoe4-build-order-ui.md:20`: the inserted clause makes the sentence hard to parse ("shows a popover at once (not a delayed browser title), except for a completed step that waited for nothing (...), which has none, with the time it waited and what blocked it"): "with the time it waited" now reads as attached to the step that has none. Not false against the code. A clearer order would put the exception after the popover's content, e.g. "... shows a popover at once (not a delayed browser title) with the time it waited and what blocked it, and for a `waiting` or `not-reached` step it reads `Still waiting. Blocked by: ...` instead of a time; a completed step that waited for nothing (for a repeated step, one whose copies all completed with no wait in total) has no popover; for a repeated step ...".
- The first step of the default build is `in-progress` with zero wait and still shows `Waited 0:00. Blocked by: nothing`. That follows the ticket (true for every non-completed status); if the owner finds it as uninformative as the completed case, it is a new ticket.
- `popoverSteps` (spec:196-200) selects steps with the production `hasPopover`, so step selection is not independent of the code under test. The no-wait test uses its own status/wait filter, and a broken predicate would empty or skew the selection loudly, so this is acceptable.

## Coverage

Reviewed every changed file: `annotation-popover.tsx`, `annotation-popover.test.ts`, `build-text-editor.tsx`, `step-annotations.ts`, `step-annotations.test.ts`, `acceptance/aoe4-step-annotations.spec.ts`, `docs/aoe4-build-order-ui.md`. Siblings compared: `step-annotations.test.ts` tables, exemplar `acceptance/aoe4-build-order-step-band.spec.ts` pattern (instant scroll, one evaluate under poll). REPO.md Review checklist: "Every diff" (build run, page loaded) and "AoE4 build order" (no copied helper or tolerance; widths 1200/1280/1800 checked; no Bootstrap/module CSS mixing in the diff) applied. No REVIEW.md at the repo root. Acceptance spec not run (by rule); judged from reading and the implementer's run and mutation record. No LSP tool available; callers found by grep (`AnnotationPopover` has one call site, updated).
