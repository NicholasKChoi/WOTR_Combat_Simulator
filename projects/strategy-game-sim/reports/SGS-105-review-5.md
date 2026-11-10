# SGS-105 review 5 (delta, rework 4)

Verdict: **APPROVE**

Delta: c016f92..f55754c, base sgs-104-split-layout at 32d9d29. One added line: `acceptance/aoe4-save-open.spec.ts:696`
`await page.setViewportSize(PHONE)`, placed before `page.goto`.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria (rework 4 scope)

- Required fix 1, run the test at `PHONE` (390x844) before `page.goto` and keep every assertion: **pass**. `PHONE` is
  `{ width: 390, height: 844 }` (spec:26). The viewport is set at :696, before the goto at :697. The diff only adds
  that line, so all eight assertions (:690, :698-:705) are still there.
- Required fix 2, both specs pass: **pass**. I ran `npx playwright test acceptance/aoe4-save-open.spec.ts
  acceptance/aoe4-split-layout.spec.ts` at f55754c and got 53 passed, including :688.
- Criterion "a saved build that no longer converts" (ticket :357): **pass**. The test loads text with `knigt` into
  the editor (:699), shows `build-order-issues` (:700), ends with `data-status` `invalid` (:698), sends no simulate
  POST (`posts` length 0 after the debounce, :702-:703), and has `tab-build` `aria-selected="true"` at 390 px (:705).
  The issues-visible assertion still holds at the phone viewport because the Build tab is the selected one.
- No other test asserts tabs at desktop: **pass**. Direct `tab-*` uses are at :705 (now at the phone viewport) and
  :715, :721-:722, :729-:730, :736, :739, which are all inside `test.describe('the tab after a load at 390 px')`
  with `test.use({ viewport: PHONE })` (:710). The other tab uses are `showTab` calls at :200, :567 and :607.
  `acceptance/helpers.ts:119` makes `showTab` depend on the viewport: at `SPLIT_MIN_WIDTH` and wider it asserts
  that the panel is visible and clicks no tab.

## Invariants

The change is test-only and touches no invariant.

## Linter

`commands.lint` (`npx tsc --noEmit && npm run lint:dup`): tsc exits 0, and jscpd finds 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty, so there was no bot run. There is no rules file.

## Conventions

In-test `page.setViewportSize(PHONE)` matches the sibling test at spec:745. No departure.

## Non-blocking notes

None.

## Coverage

I reviewed `acceptance/aoe4-save-open.spec.ts` (the whole file, for tab assertions and viewport scope) and
`acceptance/helpers.ts:119-125`. Production code is unchanged in this delta and was not re-reviewed.
