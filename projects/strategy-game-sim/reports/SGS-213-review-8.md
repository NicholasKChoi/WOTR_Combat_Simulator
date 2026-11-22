# SGS-213 review 8

Verdict: **APPROVE**

- Branch `sgs-213-step-popover-beside-text`, tip f1bf9afd40d4a9909d875cc501089ac68dae1e74, base `origin/main` 5eac2142954b5a42351f433956297e4b921f77bc (merge-base equals origin/main). Ticket type Bug, risk standard, milestone none.
- Re-review after Rework 1. My review 6 (REQUEST CHANGES at 1e46dd41) had one blocking finding. The only commit since then, f1bf9af, changes one file, `components/apps/aoe4-build-order/annotation-popover.test.ts` (+24/-22). I re-checked that file in full and the test files across the whole branch. For the production code, spec, and docs, which have not changed since 1e46dd41, I relied on review 6.
- Scratch: `worktrees/review-sgs-213-step-popover-beside-text` (removed after this report).

## Review 6 finding status

1. `annotation-popover.test.ts:49-71` (convention, five copied `placePopover` blocks): **fixed**. `annotation-popover.test.ts:49-73` is now one `it.each<[string, Partial<PlacementRects>, { left?: number; top?: number }]>` table named `'%s'` and checked with `toMatchObject`. All five rows keep the original names, overrides and expected values:
   - Rows 1 and 2 keep both `left` and `top` (`{ left: 1200 - 200 - 8, top: 324 }`; `{ left: 600 + 4, top: 800 - 60 - 8 }`, where 600 is the default textarea right that the old `input.textarea.right` read).
   - Rows 3-5 keep `top` only (`8`, `760 - 4 - 60`, `8`).
   - `placePopover` returns exactly `{ left, top }`, so `toMatchObject` with both keys is as strict as the old `toEqual` in rows 1 and 2.
   - The first three blocks (lines 29-47) are unchanged.
   - I checked every expected value by hand against `placePopover` (`annotation-popover.tsx:25-33`):
     - Row 1 falls back (beside 1104 > maxLeft 992), so left = clamp(1150, 8, 992) = 992 and top = 324.
     - Row 2 places beside, with top clamped to maxTop 732.
     - Row 3 places beside, with top clamped to 8.
     - Row 4 falls back (beside 1004 > 992). Below 784 > 732, so top = above = 696.
     - Row 5 falls back. maxTop is 32 and below 54 > 32, so above = -34, clamped to 8.
   - Mutation record (implementer 7, re-run against the table in scratch `mutate-sgs-213`, task-checkout state identical before and after):
     - beside top unclamped fails rows 2 and 3;
     - fallback always below (the rejected alternative) fails rows 4 and 5;
     - fallback left unclamped fails row 1;
     - fallback top clamp removed fails row 5.
   - Every row fails under at least one break.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

The production code, the acceptance spec and the docs have not changed since 1e46dd41, so criteria 1, 2 and 4-8 carry over from review 6 with the same evidence.

1. (respec 1) Beside the textarea at MIN/WIDE, hover and caret, unconditional: **pass** (review 6 evidence).
2. (respec 1) Top within 1 px of a centred mid-list line, and the last line stays inside the viewport: **pass** (review 6).
3. (respec 1) Unit test on the pure placement function: **pass**.
   - "Room right" is `:29`.
   - "Too little room right" is `:41` plus table rows 1, 4 and 5.
   - "Anchor near bottom" is row 2.
   - The anchor left is well left of the textarea right (default 40 vs 600), and `:35` covers the textarea edge.
   - The layout finding is fixed.
4. No popover for a completed no-wait step; predicate table; acceptance count 0 failing at the base: **pass** (review 6).
5. (respec 1) Combined-run rule unit tests: **pass** (review 6; `step-annotations.test.ts` has not changed since then).
6. Existing popover acceptance tests keep their assertions: **pass** (review 6).
7. Docs: **pass** (review 6).
8. No INVARIANTS.md regressions: **pass**.

Pre-existing tests edited: none in this delta. The table rows are tests the branch itself adds, with the same assertions as before. Test files across the branch (`git diff origin/main...HEAD` on `*.test.ts` and `acceptance/`): only `annotation-popover.test.ts` differs from what review 6 checked. Every test still meets the Bar.

## Invariants

- A1, A2, A3 (paths `components/apps/aoe4-build-order/**`): hold. The delta is a test-only change, and review 6 found the display-only production change sound.
- S1-S3, W1-W2, H1-H3: paths not touched.
- spec-checklist (Contracts, Scope, Naming, A1-A3): unchanged from review 6, all hold.

## Lint and tests

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npx vitest run annotation-popover.test.ts step-annotations.test.ts`: 123 passed.
- The implementer records a full `npm test` (3116 passed, 15 skipped) and `npx next build` succeeding at this tip. I did not re-run the build, because the delta is test-only.

## UI inspection

Not run. The delta changes no UI, so the delta-mode skip applies. Review 6 ran the inspection at 1200, 1280, 1800 and 390 px against the same production code, and the findings are listed there.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so this section was skipped.

## Non-blocking notes

Carried over from review 6 and still open:
- The sentence order in `docs/aoe4-build-order-ui.md:20` is hard to parse.
- The in-progress step 0 shows `Waited 0:00` by rule.
- `popoverSteps` in the spec selects its steps with the production `hasPopover`.

## Coverage

- Reviewed the full delta, `annotation-popover.test.ts` in full, and `placePopover` in `annotation-popover.tsx`.
- For the other changed files, which did not change in the delta, I relied on review 6.
- REPO.md Review checklist: "Every diff" and "AoE4 build order". For a test-only delta, these come down to the lint and unit runs above.
- There is no REVIEW.md, and no LSP tool was available.
