# SGS-162 root cause: acceptance/aoe4-build-order-step-band.spec.ts:143 failed once on main, then passed

- **Status**: confirmed
- **Passes**: 1 of 6; board round trips 0 of 3
- **Debug branch**: none
- **Ticket**: none (already fixed on main by ebf6865; no fix ticket needed)

## Symptom

`acceptance/aoe4-build-order-step-band.spec.ts:143` failed at f55e0aa and passed once at 5371c25 (reported by the SGS-154 implementer, 2026-11-13). Possibly flaky; SGS-150 (#160, ebf6865) added settled-state waits to this spec and may already cover it.

## Evidence

- BACKLOG.md (debug) entry, source SGS-154 implementer report.
- `git show --stat ebf6865`: #160 touched only `acceptance/aoe4-build-order-step-band.spec.ts` and `acceptance/aoe4-small-screen.spec.ts`; no product code. (pass 1)
- `git diff f55e0aa origin/main -- acceptance/aoe4-build-order-step-band.spec.ts`: the only change to the test at line 143 is ebf6865. It scrolls the start row into view instantly before the steps, asserts both rows' centres are in view, and reads band count plus active-row count in one `page.evaluate` under `expect.poll`. Its comment names the mechanism: smooth scrolling on hover or focus moves rows under the still pointer, and late `pointerenter` events change the state after an assertion passed. (pass 1)
- origin/main 0d708bc, scratch `debug-SGS-162`: `npx playwright test acceptance/aoe4-build-order-step-band.spec.ts:143 --repeat-each=40 --workers=4` gave 40 passed, 0 failed. (pass 1)
- f55e0aa, same command: 34 failed, 6 passed. Every failure shown was at line 149 (`expectNoBand`, called at line 155 right after `start.hover()`): `[data-active="true"]` count stayed 1, expected 0, for the full 5 s. (pass 1)
- f55e0aa product with the ebf6865 spec in place: 40 passed, 0 failed. So the f55e0aa app is fine, and the failure came from how the old spec drove the page. (pass 1)

## Hypotheses

1. **Confirmed.** A flake in the test only: the old spec hovered and focused rows without first scrolling the page into place. Smooth scrolling moved another row under the pointer, its late `pointerenter` marked that row active, and the "cleared" assertion saw one active row. ebf6865 fixed it.

## Ruled out

- Hypothesis 2, a product or ordering regression at f55e0aa since fixed: the f55e0aa product passes 40 of 40 with the ebf6865 spec, and ebf6865 changed no product code.

## Cause

`acceptance/aoe4-build-order-step-band.spec.ts`: the test at line 143 ("the start row clears a band set by the other input...") as it stood before ebf6865. `start.hover()` and the focus calls scrolled the page with the site's `scroll-behavior: smooth`. Rows sliding under the stationary pointer fired a late `pointerenter`, which set `data-active="true"` on a row after the hover meant to clear it. `expect(activeRows).toHaveCount(0)` then timed out at 1. This is correct browser behavior (the pointer really was over a row), not an app defect. The failure rate in this sandbox was 34 of 40 at f55e0aa; the single pass reported at 5371c25 fits a flaky test.

## Why it escaped

The LESSONS.md rule on Playwright layout checks (read all state in one evaluate or `expect.poll`, because of `scroll-behavior: smooth`) covered rect reads, not hover/focus steps that scroll the page. The spec was written before that rule, and the run that caught it at f55e0aa was the first to report it.

## Fix direction

None needed. ebf6865 (#160), already on main, fixes it: it scrolls into place instantly up front and polls one combined state read. It passed 40 of 40 at origin/main 0d708bc and 40 of 40 on the f55e0aa product. Close the backlog item as fixed by ebf6865. Optional follow-up (not a defect): extend the LESSONS.md smooth-scroll rule to cover hover and focus steps that scroll the page, or retire it once a shared helper exists.

## Owner repro steps

None needed.

## Pass log

- Pass 1 (2026-11-15): Ran line 143 with `--repeat-each=40` at origin/main 0d708bc (40/40 pass), at f55e0aa (34/40 fail, active row stays 1 after the start-row hover), and on the f55e0aa product with the ebf6865 spec (40/40 pass). Confirmed: the flake was in the test only, and ebf6865 fixed it. Ruled out a product regression.
