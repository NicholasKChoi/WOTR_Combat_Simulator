# SGS-115 review 2 (delta, Rework 1)

Verdict: **REQUEST CHANGES**

Branch `sgs-115-split-scroll`, tip `637e1ad27e268bb5056254d110a0581bd12fd96b`, base `main`. Delta reviewed: `3a0fc44..637e1ad` (one commit, 2 files: `acceptance/aoe4-split-scroll.spec.ts`, `docs/aoe4-build-order.md`). I bounced 3a0fc44 in review 1, so this pass checks that the Required fixes landed and that the delta touches nothing else. The rework includes a test change as well as text, so I read the changed test in full against its helpers.

## Blocking findings

1. `acceptance/aoe4-split-scroll.spec.ts:67` - test - The new precondition `document.documentElement.scrollHeight > window.innerHeight` checks only that the page has overflow. It does not check that the page can still scroll down, and that is the condition the wheel check depends on. The wheel is `+200` (down). If the window is already at its maximum `scrollY`, a missing `overscroll-behavior: contain` cannot move it, and `expect(after.page).toBe(before.page)` (line 74) passes whatever the CSS is. The implementer's mutation run shows how small the margin is: `scrollY` was 194 before the wheel and 245 after, so the page had only about 51 px of room left. A small layout change, or `fill` scrolling the textarea further into view, would quietly turn the assertion into a no-op. This is the data-dependence rule in common.md, Tests. Review 1's direction asked for this exact guard ("`window.scrollY` is below its maximum"), and the Required fix says "assert the page can still scroll". - Direction: replace line 67 with
   `await expect.poll(() => page.evaluate(() => window.scrollY < document.documentElement.scrollHeight - window.innerHeight)).toBe(true)`
   The production change it guards is removing `overscroll-behavior: contain` from `.column` (`components/apps/aoe4-build-order/workbench.module.css:26`). Line 74 reads `window.scrollY`, and that change moves it (the implementer's run: 194 to 245). Rerun that mutation once with the new guard in place and record the result.

## Required fixes from Rework 1

- Wheel-driven scroll check: **partially landed.** The test now scrolls the column to its end, moves the mouse over the column, calls `page.mouse.wheel(0, 200)`, waits two frames and asserts that the page and the other column did not move. The implementer records the mutation (removing `overscroll-behavior: contain` fails line 74, expected 194, received 245; CSS restored). The "page can still scroll" assertion checks the wrong condition (blocking 1).
- `docs/aoe4-build-order.md:851` (text): **landed verbatim.** The line now reads `rows) and does not scroll vertically itself (in the side-by-side layout the Build column scrolls, below 1200 px the page does; a line longer than the box scrolls sideways), and the table view is the`. It is true in both layouts: `.column` exists only in the split layout, and the tabs layout keeps the page scroll.
- The delta touches nothing else. No production code changed.

## Spec gaps

None.

## Acceptance criteria

Only the criteria the rework touches were re-checked. Everything else stands as in review 1 (no production change since 3a0fc44).

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 2 | Each column scrolls itself; window and other column unchanged | **fail** | Overflow precondition, `scrollTop > 0`, and the wheel-based "unchanged" assertions are present and failed under the mutation. The page-movable precondition is missing (blocking 1). |
| 11 | Docs "Page" describes separate scrolling and headings; no stale sentence | pass | Line 851 is fixed verbatim. No other sentence in the section changed. |
| 12 | tsc, lint:dup, npm test, specs pass | pass for tsc and lint:dup (I ran both on 637e1ad: tsc clean, 0 clones); spec run unverified by me | The implementer reports that `aoe4-split-scroll` passes. By role I ran no acceptance tests. |
| 1, 3-10, 13 | as review 1 | pass (unchanged) | No production code in the delta. |

Invariants: the delta is a test and a doc line, with no path to A1-A3 or S1-S3. All hold.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty. No bot ran.

## UI inspection

Not run. Delta mode, and the delta changes no UI (only a spec and a doc line).

## Non-blocking notes

- `aoe4-split-scroll.spec.ts:72`: the inline two-frame wait duplicates the body of `settledScrollY` (`acceptance/helpers.ts:176-177`). It does have precedent at `aoe4-compact-view.spec.ts:198`. `scrollTops` needs all three values, so the helper is not a drop-in replacement. Leave it as is or factor a frame-wait helper.
- Review 1's notes still apply: `scrollInstantly` helper at line 37, `?? document.body` at line 174, no "0 bands before hover" assertion, and scroll anchoring after the bar shrinks.

## Coverage

- Reviewed: `git diff 3a0fc44..637e1ad` (both files), the full "each column scrolls on its own" test, its helpers (`scrollTops`, `scrollColumn`, `column`), `acceptance/helpers.ts:160-180`, `workbench.module.css:26`, and the doc section around line 851.
- Lint: `npx tsc --noEmit && npm run lint:dup` run in the review worktree at 637e1ad. Both are clean.
- REPO.md Review checklist: "Every diff" (build and page load) was not repeated because the delta has no production change (review 1 ran both). "AoE4 build order": the doc sentence was checked against the code.
- Not run, by role: the acceptance specs and `npm test`.
