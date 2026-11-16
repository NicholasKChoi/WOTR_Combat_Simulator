# SGS-167 review 1

Verdict: APPROVE. Branch sgs-167-linendys-to-helpers, tip 8b017ef6a485ffdff5f3c379939ca168ab4e804c, base origin/main. Type Chore.

## Blocking findings
None.

## Chore check (no behavior change, no assertion change)
- lineEndYs: moved to acceptance/helpers.ts, built on readLayout. Same parse (`/-?[\d.]+/g`, last coordinate, NaN when no path or no `d`), same one evaluate scoped to the chart test id. Spec imports it and defines no copy.
- Converted sites, each asserting the same relation on the same quantities:
  - pin-compare 1200 s vs 300 s: `pinned.width > current.width * 2`. Now inside `expect.poll`, where it was a one-shot before. This is the ticket's named site, and the retry only makes it more tolerant of a redraw, not different in meaning. Note below.
  - pin-compare poll after invalid-input recovery: `pinned.width < current.width`. Adds a one-match requirement per side, equivalent to the old null checks. Still polled.
  - pin-compare label vs tick labels: same disjointness check. The `^\d+$` filter moves from `hasText` to the read text, and `labels` must have length 1, as the old strict-mode `boundingBox` required. `ticks.length > 1` is kept.
  - chart-views view switch: one read before and one after the click, not merged across it. The same three `not.toEqual` relations remain.
  - gathered-resources: `not.toBe` between the pinned and current `d`, one read. Counts are asserted first, so `[0]` is safe.
  - compact-view: `legend bottom <= textarea top` from one read. Selectors match the spec's own `legend` and `textarea` locators (`step-kind-legend`, `build-order-text`). `legend` is asserted to have count 1 beforehand.
- Left unchanged: single reads (drag handle, split-scroll mouse position, `clickLine`) and the local `path`/`line` locators, which are still used.

## Acceptance criteria
1. Reader exported from helpers.ts, spec imports it with no local copy: pass. I ran `npx tsc --noEmit` and `npm run lint:dup`: both pass (0 clones).
2. Every compared layout read is one evaluate: pass (sites above, listed in the implementer report).
3. Same assertions, and polls kept: pass. The one change is that the 1200 s test gained a poll, which the ticket asked for.
4. Acceptance specs pass: unverified by me (review runs no acceptance). The implementer reports 72 passed, 0 failed.
5. Moved helper reads the same value: pass by code reading. The implementer's mutation check (`.at(-1)` to `.at(0)`) failed the Buildings tests.
6. Invariants: none apply (test-only paths under acceptance/). No regressions.

## Doc claims
Both new helpers.ts comments match the code. `readLayout` returns rect, `d` and text for every match from one evaluate. `lineEndYs` returns NaN when there is no path.

## Linter
`npx tsc --noEmit` and `npm run lint:dup`: clean.

## Bot
`reviewBot` is not configured (no cli, no rulesFile). Nothing to reconcile.

## Non-blocking notes
- The food path selector pair is written three times: `FOOD_PATHS` in pin-compare, `RATE_FOOD_PATHS` in chart-views, and inline in gathered-resources. This is below the dup threshold, but a shared constant could be added later.
- compact-view repeats the `step-kind-legend` and `build-order-text` test ids inline instead of reusing its local `legend` and `textarea` helpers. Cosmetic.
- A hidden element now reads as a zero rect, where the old `boundingBox` returned null and failed the test. Every converted site asserts visibility or counts nearby, so this is not material.
- The implementer did not mutation-check the compact-view, label-vs-tick, poll-recovery and food-path conversions. They share the readLayout code path that the other checks cover.
- On merge: point the REPO.md exemplar `shows` text for acceptance/aoe4-chart-views.spec.ts at `lineEndYs` and `readLayout` in acceptance/helpers.ts.

## Coverage
Reviewed the full diff of 5 files, all under acceptance/. I did not run acceptance tests or the UI inspection (no UI change).
